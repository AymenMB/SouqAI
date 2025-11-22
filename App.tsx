import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FloatingActionButton from './components/FloatingActionButton';
import ExplorerFeed from './components/ExplorerFeed';
import AuthModal from './components/AuthModal';
import HabibiChat from './components/HabibiChat';
import MagicUploader from './components/MagicUploader';
import Dashboard from './components/Dashboard';
import { supabase } from './services/supabaseClient';
import { User, AppState, Language } from './types';

function App() {
  // Global State
  const [user, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [lang, setLang] = useState<Language>('en');

  // UI Toggles
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
          avatar: session.user.user_metadata.avatar_url
        });
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
          avatar: session.user.user_metadata.avatar_url
        });
      } else {
        setUser(null);
        setAppState(AppState.HOME);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handlers
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAppState(AppState.HOME);
  };

  const handleSellClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setAppState(AppState.SELLER_FLOW);
    }
  };

  const handleCartClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setAppState(AppState.DASHBOARD); // Using Dashboard as a placeholder for Cart/Profile for now
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-dark-grey dark:text-background-light">

      <Navbar
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
        onLogoutClick={handleLogout}
        onCartClick={handleCartClick}
        onSellClick={handleSellClick}
        onHomeClick={() => setAppState(AppState.HOME)}
      />

      <main className="flex-1 w-full relative">
        {appState === AppState.HOME && <ExplorerFeed />}

        {appState === AppState.SELLER_FLOW && user && (
          <div className="py-8 px-4">
            <MagicUploader
              user={user}
              lang={lang}
              onComplete={() => setAppState(AppState.DASHBOARD)}
            />
          </div>
        )}

        {appState === AppState.DASHBOARD && user && (
          <div className="py-8">
            <Dashboard user={user} lang={lang} />
          </div>
        )}
      </main>

      {/* Overlays */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            >
              ✕
            </button>
            <AuthModal lang={lang} onLogin={handleLogin} />
          </div>
        </div>
      )}

      {/* Chat Overlay */}
      <div className={`fixed bottom-24 left-8 z-[55] w-96 h-[500px] transition-all duration-300 transform origin-bottom-left ${showChat ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <HabibiChat lang={lang} />
      </div>

      <FloatingActionButton onClick={() => setShowChat(!showChat)} />
    </div>
  );
}

export default App;
