
import React, { useState, useRef, useEffect } from 'react';
import { refineProductDetails, editProductImage, constructGenPrompt, generateProductVideo, fileToBase64 } from '../services/aiMediaService';
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
  const [customPrompt, setCustomPrompt] = useState('');
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
    } catch (err) {
      console.error("Refinement failed, using manual input", err);
      // If AI fails, we just continue with what the user wrote
    } finally {
      // CRITICAL FIX: Always advance to the next step!
      setStep('style');
    }
  };

  const handleGenerateImage = async () => {
    if (!originalBase64) return;
    setStep('generating');
    try {
      const prompt = constructGenPrompt(draft.category, selectedStyle, customPrompt);
      const newImage = await editProductImage(originalBase64, prompt);
      setGeneratedImage(newImage);
      setStep('review');
    } catch (err: any) {
      setError(err.message);
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
       <div className="bg-white rounded-3xl shadow-xl p-8 max-w-4xl mx-auto border border-slate-100">
         <div className="flex flex-col md:flex-row gap-8 h-full">
            {/* Draft Preview */}
            <div className="w-full md:w-1/3 bg-slate-50 p-6 rounded-2xl border border-slate-200 h-fit">
              <h3 className="font-bold text-slate-900 mb-2">{draft.title}</h3>
              <div className="flex flex-wrap gap-1 mb-3">
                {draft.tags?.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold uppercase">{tag}</span>
                ))}
              </div>
              <p className="text-sm text-slate-500 mb-4">{draft.description}</p>
              <p className="font-bold text-xl text-red-600">{draft.price} TND</p>
            </div>

            {/* Style Selector */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Choose a Style</h2>
              <p className="text-slate-500 mb-6">How should the product look?</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
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
                      checked={selectedStyle === 'custom'} 
                      onChange={() => setSelectedStyle('custom')}
                      className="text-red-600 focus:ring-red-500"
                   />
                   <span className="font-bold text-slate-800">Custom Prompt</span>
                 </div>
                 <input 
                    type="text" 
                    placeholder="e.g. standing on a rock in Mars..."
                    disabled={selectedStyle !== 'custom'}
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
                 />
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleGenerateImage}
                  className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                  Generate Photos 🎨
                </button>
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
