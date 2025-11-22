
import React, { useState } from 'react';
import { translations } from '../i18n';
import { Language, User } from '../types';
import { dbService } from '../services/dbService';

interface AuthModalProps {
  lang: Language;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ lang, onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const t = translations[lang].auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignUp && !name) return;

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const res = await dbService.signUp(email, password, name);
        if (res.error) throw new Error(res.error);
        // Auto login after sign up if Supabase config allows, otherwise ask to confirm email
        // For this demo, assuming email confirmation is OFF or we prompt user.
        // Supabase default usually requires email confirm. 
        // We will try to sign in immediately.
        const loginRes = await dbService.signIn(email, password);
        if (loginRes.user) {
          onLogin(loginRes.user);
        } else {
          setError("Please check your email to confirm your account.");
        }
      } else {
        const res = await dbService.signIn(email, password);
        if (res.error) throw new Error(res.error);
        if (res.user) onLogin(res.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-100 relative overflow-hidden">
        {/* Decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-sm">
            S
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isSignUp ? (lang === 'ar' ? 'عمل حساب جديد' : 'Create Account') : t.title}
          </h2>
          <p className="text-slate-500 mt-2">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">{lang === 'ar' ? 'الاسم' : 'Full Name'}</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">{lang === 'ar' ? 'كلمة السر' : 'Password'}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              required
              minLength={6}
            />
          </div>

          {error && (
             <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
               <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               {error}
             </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-xl transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              isSignUp ? (lang === 'ar' ? 'سجل' : 'Sign Up') : t.button
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-slate-500 hover:text-red-600 font-semibold transition-colors"
          >
            {isSignUp 
              ? (lang === 'ar' ? 'عندك كونت؟ سجل دخولك' : 'Already have an account? Log In') 
              : (lang === 'ar' ? 'ما عندكش كونت؟ اعمل واحد' : 'Don\'t have an account? Sign Up')}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8 px-4">
          {t.footer}
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
