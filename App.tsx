
import React, { useState, useEffect } from 'react';
import MagicUploader from './components/MagicUploader';
import HabibiChat from './components/HabibiChat';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import { AppState, Language, User, ProductListing } from './types';
import { translations } from './i18n';
import { dbService } from './services/dbService';

const App: React.FC = () => {
  const [view, setView] = useState<AppState>(AppState.HOME);
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<ProductListing[]>([]);
  const t = translations[lang];

  // Handle RTL direction change
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Check for active session on load
  useEffect(() => {
    const checkSession = async () => {
      const currentUser = await dbService.getCurrentUser();
      if (currentUser) setUser(currentUser);
    };
    checkSession();
  }, []);

  // Load Products
  useEffect(() => {
    const loadData = async () => {
      const items = await dbService.getProducts();
      setProducts(items);
    };
    loadData();
  }, [view]); // Reload when view changes (e.g. after selling)

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView(AppState.HOME);
  };

  const handleLogout = async () => {
    await dbService.signOut();
    setUser(null);
    setView(AppState.HOME);
  };

  const handleSellClick = () => {
    if (user) {
      setView(AppState.SELLER_FLOW);
    } else {
      setView(AppState.AUTH);
    }
  };

  const handleViewProduct = async (id: string) => {
    // Increment view in background
    dbService.incrementView(id);
    // For now just alert or log, in full app would open details page
    // But we don't have a details page in the prompt request
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-red-100 selection:text-red-900 ${lang === 'ar' ? 'font-arabic' : ''}`}>
      {/* Glassmorphism Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => setView(AppState.HOME)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-500/20 transform group-hover:scale-105 transition-transform">
                S
              </div>
              <span className="font-bold text-2xl tracking-tight text-slate-900">
                Souq<span className="text-red-600">AI</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
              <button 
                onClick={() => setView(AppState.HOME)}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${view === AppState.HOME ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {t.nav.explore}
              </button>
              <button 
                onClick={handleSellClick}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${view === AppState.SELLER_FLOW ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {t.nav.sell}
              </button>
              <button 
                onClick={() => setView(AppState.BUYER_FLOW)}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${view === AppState.BUYER_FLOW ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {t.nav.chat}
              </button>
            </div>

            <div className="flex items-center gap-4">
               {/* Language Switcher */}
               <div className="flex items-center bg-slate-100 rounded-lg p-1">
                 {(['en', 'fr', 'ar'] as Language[]).map((l) => (
                   <button
                     key={l}
                     onClick={() => setLang(l)}
                     className={`px-2 py-1 text-xs font-bold rounded uppercase transition-colors ${lang === l ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     {l}
                   </button>
                 ))}
               </div>

               {user ? (
                 <div className="flex items-center gap-3 pl-2 border-l border-slate-200 ml-2">
                   <button onClick={() => setView(AppState.DASHBOARD)} className="group">
                      <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=red&color=fff`} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200 group-hover:ring-2 group-hover:ring-red-200 transition-all" />
                   </button>
                   <button 
                      onClick={handleLogout}
                      className="text-xs font-bold text-red-600 hover:underline"
                   >
                     {t.nav.logout}
                   </button>
                 </div>
               ) : (
                 <button 
                    onClick={() => setView(AppState.AUTH)}
                    className="text-sm font-bold text-slate-900 hover:text-red-600 transition-colors"
                 >
                   {t.nav.login}
                 </button>
               )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-12">
        
        {view === AppState.AUTH && (
          <AuthModal lang={lang} onLogin={handleLogin} />
        )}

        {view === AppState.DASHBOARD && user && (
          <Dashboard lang={lang} user={user} />
        )}

        {view === AppState.HOME && (
          <div className="animate-fade-in">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
              <div className="text-center max-w-3xl mx-auto pt-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 text-sm font-semibold mb-8 border border-red-100">
                  <span className="text-xs bg-red-200 px-2 py-0.5 rounded-full text-red-800">{t.hero.new}</span>
                  {t.hero.badge}
                </div>
                <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
                  {t.hero.title}
                </h1>
                <p className="text-xl text-slate-500 mb-12 leading-relaxed px-4">
                  {t.hero.subtitle}
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-5">
                  <button 
                    onClick={handleSellClick}
                    className="group relative px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30 transform hover:-translate-y-1 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 transition-all group-hover:scale-105"></div>
                    <span className="relative flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {t.hero.ctaSell}
                    </span>
                  </button>
                  <button 
                     onClick={() => setView(AppState.BUYER_FLOW)}
                    className="group px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 hover:border-red-200 hover:bg-red-50/50 transform hover:-translate-y-1 transition-all flex items-center gap-3 justify-center"
                  >
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                    {t.hero.ctaChat}
                  </button>
                </div>
              </div>
            </div>

            {/* Trending Grid (Dynamic) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200">
               <div className="flex justify-between items-end mb-10">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-900">{t.trending.title}</h2>
                    <p className="text-slate-500 mt-1">{t.trending.subtitle}</p>
                 </div>
                 <button className="text-red-600 font-medium hover:text-red-700 flex items-center gap-1">
                   {t.trending.viewAll}
                   <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                 </button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                 {products.map((item) => (
                   <div 
                     key={item.id} 
                     className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer"
                     onClick={() => handleViewProduct(item.id)}
                   >
                     <div className="relative aspect-[4/5] overflow-hidden">
                       <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                       <div className="absolute top-3 right-3 rtl:left-3 rtl:right-auto bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-slate-900 shadow-sm">
                         {item.category}
                       </div>
                       {item.videoUrl && (
                         <div className="absolute bottom-3 left-3 rtl:right-3 rtl:left-auto bg-black/50 backdrop-blur-sm p-1.5 rounded-full text-white">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path></svg>
                         </div>
                       )}
                     </div>
                     <div className="p-4">
                       <h3 className="font-bold text-slate-900 text-lg mb-1">{item.title}</h3>
                       <div className="flex justify-between items-center">
                          <p className="text-red-600 font-semibold">{item.price} {item.currency}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                             <span>👁️ {item.views || 0}</span>
                             <span>• {item.sellerName}</span>
                          </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {view === AppState.SELLER_FLOW && user && (
          <div className="animate-fade-in max-w-5xl mx-auto px-4">
            <MagicUploader 
              onComplete={() => setView(AppState.HOME)} 
              lang={lang} 
              user={user}
            />
          </div>
        )}

        {view === AppState.BUYER_FLOW && (
          <div className="animate-fade-in max-w-4xl mx-auto px-4 h-[calc(100vh-8rem)]">
            <HabibiChat lang={lang} />
          </div>
        )}
      </main>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
