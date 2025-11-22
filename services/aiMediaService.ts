
import { GoogleGenAI, Type } from "@google/genai";
import { ProductDraft, Language } from "../types";

/**
 * Helper: Retry logic for API calls
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimitError = error?.message?.includes('429') || error?.status === 429;
      const isLastAttempt = i === maxRetries - 1;
      
      if (!isRateLimitError || isLastAttempt) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Rate limited. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};

/**
 * Helper: Convert File to Base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Step 1: Refine User Input
 * AI takes user's draft (Title, Desc) + Image and improves it.
 */
export const refineProductDetails = async (base64Image: string, currentDraft: ProductDraft, lang: Language = 'en'): Promise<ProductDraft> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Google Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.');
  }

  const ai = new GoogleGenAI({ apiKey });
  
  let langInstruction = "in English";
  if (lang === 'fr') langInstruction = "in French";
  if (lang === 'ar') langInstruction = "in Tunisian Arabic (Derja)";

  const prompt = `
    You are an expert e-commerce copywriter.
    I have a product image and some basic details provided by the user.
    
    User's Title: "${currentDraft.title}"
    User's Description: "${currentDraft.description}"
    User's Category: "${currentDraft.category}"

    Your task:
    1. Improve the 'title' to be more catchy and SEO friendly.
    2. Improve the 'description' to be persuasive, highlighting features visible in the image that the user might have missed. Keep it concise.
    3. Generate 5 relevant 'tags' for search.
    4. Confirm or correct the 'category'.
    
    Output ${langInstruction}.
    IMPORTANT: Return strictly pure JSON. Do not wrap in markdown code blocks.
  `;

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Use Flash for speed
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['title', 'description', 'category', 'tags']
        }
      }
    });

    if (response.text) {
      let cleanJson = response.text.trim();
      // Remove Markdown wrapper if present
      if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '');
      }
      
      try {
          const result = JSON.parse(cleanJson);
          return {
          ...currentDraft,
          title: result.title,
          description: result.description,
          category: result.category,
          tags: result.tags
          };
      } catch (e) {
          console.error("Failed to parse JSON", e);
          // Return original draft on failure
          return currentDraft;
      }
    }
    throw new Error("Failed to refine product details");
  });
};

/**
 * Step 2: Generate Prompt Logic (Narrative-based for Nano Banana)
 * Combines product description, style preset, and style modifiers into a cohesive narrative
 */
export const constructNanoBananaPrompt = (productDesc: string, selectedStyle: string, styleModifier?: string): string => {
  // Narrative-based style presets optimized for Gemini 2.5 Flash Image (Nano Banana)
  const stylePresets: Record<string, string> = {
    'studio': "The product is presented in a high-end professional studio setting. Clean, crisp white infinity background. Soft, even studio lighting to highlight packaging details. High-resolution commercial photography style.",
    'lifestyle': "The product is placed in a realistic, everyday context suitable for its use (e.g., a cozy home, a garage, or a desk). Natural daylighting, shallow depth of field to blur the background slightly. Authentic and relatable atmosphere.",
    'outdoor': "The product is photographed outdoors in a natural environment with sun-drenched lighting. Vivid colors and dynamic shadows. Nature-inspired background.",
    'luxury': "The product is showcased in a premium, elegant setting. Dark, moody lighting with dramatic rim lights. Placed on a polished surface (marble or glass) with a reflection. Sophisticated and expensive aesthetic."
  };

  let corePrompt = "";

  if (selectedStyle === 'custom') {
    // If custom, the user provides the complete scene description
    corePrompt = `A high-quality image of ${productDesc}. ${styleModifier || 'Professional product photography.'}`;
  } else {
    // Combine inputs into a narrative (Subject + Setting + Lighting/Style)
    const baseStyle = stylePresets[selectedStyle.toLowerCase()] || stylePresets['studio'];
    const effectsAddition = styleModifier ? ` Add the following specific effects: ${styleModifier}.` : "";
    
    corePrompt = `Create a photorealistic image of ${productDesc}. ${baseStyle}${effectsAddition} Ensure the product text and branding remains legible and clear.`;
  }

  return corePrompt;
};

/**
 * Step 3: Edit (Nano Banana)
 */
export const editProductImage = async (base64Image: string, prompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Google Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.');
  }

  const ai = new GoogleGenAI({ apiKey });
  
  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image generated");
  }, 5, 2000); // More retries for image generation, longer delays
};

/**
 * Step 4: Generate Video (Veo)
 */
export const generateProductVideo = async (base64Image: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Google Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.');
  }

  // Ensure API key is selected for Veo
  if ('aistudio' in window) {
      const aistudio = (window as any).aistudio;
      if (!await aistudio.hasSelectedApiKey()) {
          await aistudio.openSelectKey();
      }
  }

  // Create a FRESH instance to pick up the key
  const veoAi = new GoogleGenAI({ apiKey });

  let operation = await veoAi.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    image: {
      imageBytes: base64Image,
      mimeType: 'image/png', 
    },
    prompt: "Cinematic slow pan of the product, luxury showcase, 4k, highly detailed, commercial style.",
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await veoAi.operations.getVideosOperation({ operation: operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");

  const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  const videoBlob = await videoResponse.blob();
  return URL.createObjectURL(videoBlob);
};
