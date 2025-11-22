
import { GoogleGenAI, Type } from "@google/genai";
import { ProductDraft, Language } from "../types";

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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
};

/**
 * Step 2: Generate Prompt Logic
 * Now accepts a 'style' or 'customPrompt' from the user
 */
export const constructGenPrompt = (category: string, style: string, customPrompt?: string): string => {
  const c = category.toLowerCase();
  
  if (style === 'custom' && customPrompt) {
     return `Create a professional product image. KEEP THE MAIN OBJECT EXACTLY AS IT IS. Place the object in ${customPrompt}. seamless composite, photorealistic, 8k.`;
  }

  let setting = "";

  switch (style) {
    case 'studio':
      setting = "a professional white studio podium with soft studio lighting and a subtle reflection. Clean, commercial product photography.";
      break;
    case 'lifestyle':
      setting = "a real-world lifestyle setting appropriate for the product (e.g., on a wooden table, in a living room, or being used). Natural lighting, depth of field.";
      break;
    case 'outdoor':
      setting = "an outdoor setting with natural sunlight, perhaps a garden, street, or nature background depending on the item.";
      break;
    case 'luxury':
      setting = "a high-end luxury setting with dark marble textures, gold accents, and dramatic cinematic lighting.";
      break;
    default:
      // Fallback based on category if no specific style selected
      if (c.includes('tech')) setting = "a sleek, modern minimalist desk.";
      else if (c.includes('fashion')) setting = "an urban street style setting.";
      else setting = "a clean bright studio background.";
  }

  return `Create a professional product image. KEEP THE MAIN OBJECT EXACTLY AS IT IS. Do not change the product's shape, logo, or details. seamless composite, photorealistic, 8k. Place the object in ${setting}`;
};

/**
 * Step 3: Edit (Nano Banana)
 */
export const editProductImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
};

/**
 * Step 4: Generate Video (Veo)
 */
export const generateProductVideo = async (base64Image: string): Promise<string> => {
  // Ensure API key is selected for Veo
  if ('aistudio' in window) {
      const aistudio = (window as any).aistudio;
      if (!await aistudio.hasSelectedApiKey()) {
          await aistudio.openSelectKey();
      }
  }

  // Create a FRESH instance to pick up the key
  const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
