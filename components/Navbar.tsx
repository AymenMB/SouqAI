import React from 'react';
import { Search, ShoppingCart, User as UserIcon, Sparkles, LogOut, Store } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
    user: User | null;
    onLoginClick: () => void;
    onLogoutClick: () => void;
    onCartClick: () => void;
    onSellClick: () => void;
    onHomeClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
    user,
    onLoginClick,
    onLogoutClick,
    onCartClick,
    onSellClick,
    onHomeClick
}) => {
    return (
        <header className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between w-full h-16 px-6 bg-pure-white/80 dark:bg-background-dark/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-2xl shadow-soft transition-all duration-300">

                    {/* Logo Section */}
                    <div
                        className="flex items-center gap-3 text-dark-grey dark:text-background-light cursor-pointer group"
                        onClick={onHomeClick}
                    >
                        <div className="size-8 text-primary group-hover:scale-110 transition-transform duration-300">
                            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" fill="currentColor" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold tracking-tighter">SouqAI</h2>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 px-4 sm:px-8 lg:px-16 hidden md:block">
                        <div className="relative w-full max-w-lg mx-auto group">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <Sparkles className="size-5 text-primary group-focus-within:animate-pulse" />
                            </div>
                            <input
                                type="text"
                                className="block w-full rounded-full border-0 bg-light-grey dark:bg-gray-800 py-2.5 pl-11 pr-4 text-dark-grey dark:text-background-light placeholder:text-medium-grey focus:ring-2 focus:ring-inset focus:ring-primary/50 text-base transition-all duration-300 hover:bg-white dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 shadow-sm"
                                placeholder="Ask Habibi..."
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4 sm:gap-6">
                        {user ? (
                            <>
                                <button
                                    onClick={onSellClick}
                                    className="hidden sm:flex items-center gap-2 text-dark-grey dark:text-background-light hover:text-primary dark:hover:text-primary transition-colors font-medium"
                                >
                                    <Store className="size-5" />
                                    <span>Sell</span>
                                </button>

                                <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-700">
                                    <div className="size-9 rounded-full bg-gray-200 overflow-hidden border-2 border-transparent hover:border-primary transition-colors cursor-pointer">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={onLogoutClick}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Log Out"
                                    >
                                        <LogOut className="size-5" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="hidden sm:block text-dark-grey dark:text-background-light text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors whitespace-nowrap"
                            >
                                Login / Sign Up
                            </button>
                        )}

                        <button
                            onClick={onCartClick}
                            className="text-dark-grey dark:text-background-light hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-2 group ml-2"
                        >
                            <div className="relative">
                                <ShoppingCart className="size-6 group-hover:scale-110 transition-transform" />
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold size-4 flex items-center justify-center rounded-full">2</span>
                            </div>
                            <span className="hidden lg:inline text-sm font-medium">Cart</span>
                        </button>
                    </div>

                </div>
            </div>
        </header>
    );
};

export default Navbar;
