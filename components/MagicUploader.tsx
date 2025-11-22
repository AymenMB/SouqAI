
import React, { useState, useRef, useEffect } from 'react';
import { refineProductDetails, editProductImage, constructNanoBananaPrompt, generateProductVideo, fileToBase64 } from '../services/aiMediaService';
import { dbService } from '../services/dbService';
import { ProductDraft, Language, User, Organization } from '../types';
import { translations } from '../i18n';

interface MagicUploaderProps {
  onComplete: () => void;
  lang: Language;
  user: User;
}

type Step = 'upload_form' | 'refine' | 'style' | 'generating' | 'review' | 'publishing' | 'done';

const MagicUploader: React.FC<MagicUploaderProps> = ({ onComplete, lang, user }) => {
  const t = translations[lang].upload;
  const [step, setStep] = useState<Step>('upload_form');
  
  // Data State
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>(''); // '' means Personal
  const [file, setFile] = useState<File | null>(null);
  const [originalBase64, setOriginalBase64] = useState<string | null>(null);
  
  // Form State
  const [draft, setDraft] = useState<ProductDraft>({
    title: '',
    description: '',
    price: 0,
    category: 'Other',
    tags: []
  });

  // Generation State
  const [selectedStyle, setSelectedStyle] = useState<string>('studio');
  const [styleModifier, setStyleModifier] = useState<string>(''); // New: Additional effects/vibe
  const [editableDescription, setEditableDescription] = useState<string>(''); // New: Editable product description
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load organizations on mount
    dbService.getOrganizations(user.id).then(setOrgs);
  }, [user.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      const b64 = await fileToBase64(f);
      setOriginalBase64(b64);
    }
  };

  const handleNextToRefine = async () => {
    if (!originalBase64 || !draft.title || !draft.price) {
      setError("Please fill in the required fields and upload an image.");
      return;
    }
    
    setStep('refine');
    setError(null);
    
    try {
      // AI Refinement Call
      const refined = await refineProductDetails(originalBase64, draft, lang);
      setDraft(refined);
      // Initialize editable description with AI-refined description
      setEditableDescription(refined.description);
    } catch (err) {
      console.error("Refinement failed, using manual input", err);
      // If AI fails, use the user's original input
      setEditableDescription(draft.description);
    } finally {
      // CRITICAL FIX: Always advance to the next step!
      setStep('style');
    }
  };

  const handleGenerateImage = async () => {
    if (!originalBase64) return;
    setStep('generating');
    setError(null);
    
    try {
      // Use the editable description and construct narrative prompt
      const productDesc = editableDescription || draft.description;
      const prompt = constructNanoBananaPrompt(
        productDesc, 
        selectedStyle, 
        selectedStyle === 'custom' ? styleModifier : styleModifier
      );
      
      console.log('Generated Narrative Prompt:', prompt); // Debug log
      
      const newImage = await editProductImage(originalBase64, prompt);
      setGeneratedImage(newImage);
      // Update draft description with the edited one
      setDraft({...draft, description: productDesc});
      setStep('review');
    } catch (err: any) {
      console.error('Image generation error:', err);
      
      // Provide user-friendly error messages
      let userMessage = "Failed to generate image. ";
      if (err.message?.includes('429') || err.message?.includes('rate limit')) {
        userMessage += "API rate limit exceeded. Please wait a moment and try again, or try a simpler prompt.";
      } else if (err.message?.includes('API key')) {
        userMessage += err.message;
      } else {
        userMessage += "Please try again with a different style or simpler prompt.";
      }
      
      setError(userMessage);
      setStep('style'); // Go back
    }
  };

  const handleGenerateVideo = async () => {
    if (!generatedImage) return;
    setIsGeneratingVideo(true);
    try {
      const vidUrl = await generateProductVideo(generatedImage);
      setGeneratedVideo(vidUrl);
    } catch (err) {
      console.error("Video gen failed", err);
      alert("Video generation failed, but you can still publish the image.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedImage) return;
    setStep('publishing');
    try {
      const sellerName = selectedOrgId 
        ? orgs.find(o => o.id === selectedOrgId)?.name || user.name 
        : user.name;

      await dbService.createProduct({
        sellerId: user.id,
        sellerName: sellerName,
        organizationId: selectedOrgId || undefined,
        title: draft.title,
        description: draft.description,
        price: draft.price,
        currency: 'TND',
        category: draft.category,
        imageUrl: '', // set by dbService
      }, generatedImage, generatedVideo || undefined);
      
      setStep('done');
      setTimeout(onComplete, 2000);
    } catch (err: any) {
      setError(err.message);
      setStep('review');
    }
  };

  // --- RENDER STEPS ---

  if (step === 'upload_form') {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-3xl mx-auto border border-slate-100">
        <h2 className="text-2xl font-bold mb-6 text-slate-900">{t.title}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Image Upload */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center h-64 cursor-pointer transition-all ${originalBase64 ? 'border-green-500 bg-green-50/30' : 'border-slate-300 hover:border-red-400 hover:bg-red-50'}`}
          >
             {originalBase64 ? (
               <img src={`data:image/jpeg;base64,${originalBase64}`} className="h-full w-full object-contain rounded-xl" alt="Preview" />
             ) : (
               <>
                 <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">📷</div>
                 <p className="text-sm text-slate-500 font-medium">{t.dropTitle}</p>
               </>
             )}
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>

          {/* Right: Form */}
          <div className="space-y-4">
             {/* Org Selector */}
             {orgs.length > 0 && (
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Organization</label>
                 <select 
                    value={selectedOrgId} 
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-red-500"
                 >
                   <option value="">Personal ({user.name})</option>
                   {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                 </select>
               </div>
             )}

             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Title</label>
               <input 
                 type="text" 
                 className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-red-500"
                 placeholder="e.g. iPhone 13 Pro Max"
                 value={draft.title}
                 onChange={e => setDraft({...draft, title: e.target.value})}
               />
             </div>

             <div className="flex gap-4">
               <div className="flex-1">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price (TND)</label>
                 <input 
                   type="number" 
                   className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-red-500"
                   value={draft.price || ''}
                   onChange={e => setDraft({...draft, price: parseFloat(e.target.value)})}
                 />
               </div>
               <div className="flex-1">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                 <select 
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-red-500"
                    value={draft.category}
                    onChange={e => setDraft({...draft, category: e.target.value})}
                 >
                   <option>Electronics</option>
                   <option>Fashion</option>
                   <option>Home</option>
                   <option>Automotive</option>
                   <option>Other</option>
                 </select>
               </div>
             </div>

             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
               <textarea 
                 className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-red-500 h-24 resize-none"
                 placeholder="Short description..."
                 value={draft.description}
                 onChange={e => setDraft({...draft, description: e.target.value})}
               />
             </div>

             <button 
                onClick={handleNextToRefine}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
             >
               Next: AI Enhancement
             </button>
             
             {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'refine') {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-3xl mx-auto border border-slate-100 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse">✨</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">AI is polishing your details...</h2>
        <p className="text-slate-500 mb-8">Gemini is generating tags and improving your description.</p>
        
        <div className="bg-slate-50 p-6 rounded-2xl text-left max-w-md mx-auto border border-slate-200">
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse"></div>
          </div>
        </div>

        <button onClick={() => setStep('style')} className="mt-8 text-slate-400 hover:text-slate-600 text-sm underline">Skip</button>
      </div>
    );
  }

  if (step === 'style') {
     return (
       <div className="bg-white rounded-3xl shadow-xl p-8 max-w-5xl mx-auto border border-slate-100">
         <h2 className="text-2xl font-bold mb-6 text-slate-900">Style Your Product Photo</h2>
         
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Product Info & Description Edit */}
            <div className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">{draft.title}</h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  {draft.tags?.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold uppercase">{tag}</span>
                  ))}
                </div>
                <p className="font-bold text-xl text-red-600 mb-2">{draft.price} TND</p>
                <p className="text-xs text-slate-400">{draft.category}</p>
              </div>

              {/* Editable Product Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  📝 Refine Product Description
                </label>
                <p className="text-xs text-slate-500 mb-2">Edit this to better describe what the product IS:</p>
                <textarea 
                  value={editableDescription}
                  onChange={(e) => setEditableDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border-2 border-slate-200 outline-none focus:border-red-500 h-32 resize-none text-sm"
                  placeholder="Describe the product in detail..."
                />
              </div>
            </div>

            {/* Column 2 & 3: Style Selection */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3 text-slate-900">Choose a Style</h3>
                <p className="text-sm text-slate-500 mb-4">How should the product look?</p>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                   {['studio', 'lifestyle', 'outdoor', 'luxury'].map(style => (
                     <button 
                       key={style}
                       onClick={() => setSelectedStyle(style)}
                       className={`p-4 rounded-xl border-2 text-left transition-all ${selectedStyle === style ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}
                     >
                       <span className="block font-bold capitalize text-slate-800">{style}</span>
                       <span className="text-xs text-slate-500">
                         {style === 'studio' && 'Clean white background'}
                         {style === 'lifestyle' && 'In a real home/context'}
                         {style === 'outdoor' && 'Natural lighting'}
                         {style === 'luxury' && 'Dark, elegant, premium'}
                       </span>
                     </button>
                   ))}
                </div>

                <div className={`p-4 rounded-xl border-2 transition-all ${selectedStyle === 'custom' ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}>
                   <div className="flex items-center gap-2 mb-2">
                     <input 
                        type="radio" 
                        id="custom-style"
                        checked={selectedStyle === 'custom'} 
                        onChange={() => setSelectedStyle('custom')}
                        className="text-red-600 focus:ring-red-500"
                     />
                     <label htmlFor="custom-style" className="font-bold text-slate-800 cursor-pointer">Custom Scene</label>
                   </div>
                   <input 
                      type="text" 
                      placeholder="e.g. floating in space, on a marble countertop..."
                      disabled={selectedStyle !== 'custom'}
                      value={styleModifier}
                      onChange={e => setStyleModifier(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                   />
                </div>
              </div>

              {/* Style Modifier - Additional Effects */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  ✨ Additional Effects / Vibe <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">Add specific lighting, effects, or atmosphere:</p>
                <input 
                  type="text"
                  value={styleModifier}
                  onChange={(e) => setStyleModifier(e.target.value)}
                  disabled={selectedStyle === 'custom'}
                  placeholder="e.g., cinematic lighting, 3D render, splash effect, bokeh background..."
                  className="w-full p-3 rounded-xl bg-white border-2 border-slate-200 outline-none focus:border-red-500 text-sm disabled:bg-slate-50"
                />
                <p className="text-xs text-slate-400 mt-1">
                  💡 Tip: Use descriptive phrases like "soft morning light" or "dramatic shadows"
                </p>
              </div>

              {/* Error Display & Generate Button */}
              <div className="pt-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
                    <strong>⚠️ Error:</strong> {error}
                  </div>
                )}
                
                <button 
                  onClick={handleGenerateImage}
                  disabled={step === 'generating' || !editableDescription.trim()}
                  className="w-full bg-gradient-to-r from-slate-900 to-slate-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {step === 'generating' ? 'Generating...' : '🎨 Generate Photos'}
                </button>
                
                <p className="text-xs text-center text-slate-400 mt-3">
                  Using Gemini 2.5 Flash Image (Nano Banana) for photorealistic results
                </p>
              </div>
            </div>
         </div>
       </div>
     )
  }

  if (step === 'generating') {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md mx-auto text-center border border-slate-100">
         <div className="w-20 h-20 border-4 border-red-100 border-t-red-600 rounded-full animate-spin mx-auto mb-6"></div>
         <h3 className="text-xl font-bold text-slate-900">Nano Banana is working...</h3>
         <p className="text-slate-500 mt-2">Generating high-quality images based on your style.</p>
         <p className="text-xs text-slate-400 mt-4">This may take 10-30 seconds. If you see rate limit errors, we'll automatically retry.</p>
      </div>
    )
  }

  if (step === 'review') {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-4xl mx-auto border border-slate-100">
        <div className="flex flex-col md:flex-row gap-8">
           <div className="flex-1">
             <div className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden shadow-inner mb-4 group">
                {generatedVideo ? (
                  <video src={generatedVideo} autoPlay loop muted className="w-full h-full object-cover" />
                ) : (
                  <img src={`data:image/jpeg;base64,${generatedImage}`} className="w-full h-full object-cover" alt="Generated" />
                )}
                
                {!generatedVideo && (
                  <div className="absolute bottom-4 right-4">
                    <button 
                      onClick={handleGenerateVideo}
                      disabled={isGeneratingVideo}
                      className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-red-600 transition-colors"
                    >
                      {isGeneratingVideo ? 'Generating...' : '🎬 Create Video'}
                    </button>
                  </div>
                )}
             </div>
           </div>
           
           <div className="w-full md:w-1/3 flex flex-col justify-center space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Review Listing</h2>
                <p className="text-slate-500 text-sm">Ready to publish to {selectedOrgId ? 'Organization' : 'Personal'}?</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-2">
                 <div className="flex justify-between">
                   <span className="text-slate-500">Title:</span>
                   <span className="font-medium">{draft.title}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-slate-500">Price:</span>
                   <span className="font-medium text-red-600">{draft.price} TND</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-slate-500">Category:</span>
                   <span className="font-medium">{draft.category}</span>
                 </div>
              </div>

              <button 
                 onClick={handlePublish}
                 className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
              >
                Confirm & Publish
              </button>
              
              <button 
                 onClick={() => setStep('style')}
                 className="w-full bg-white border border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all"
              >
                Try Different Style
              </button>
           </div>
        </div>
      </div>
    )
  }

  if (step === 'publishing' || step === 'done') {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md mx-auto text-center border border-slate-100">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          {step === 'done' ? '✓' : '🚀'}
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          {step === 'done' ? 'Published Successfully!' : 'Publishing...'}
        </h3>
        <p className="text-slate-500 mt-2">Your product is now live on the marketplace.</p>
      </div>
    )
  }

  return null;
};

export default MagicUploader;
