import React from 'react';
import { MessageCircle } from 'lucide-react';

interface FloatingActionButtonProps {
    onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-8 left-8 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 hover:scale-110 hover:shadow-primary/30 transition-all duration-300 group"
            title="Chat with Habibi"
        >
            <MessageCircle className="size-7 group-hover:rotate-12 transition-transform duration-300" />

            {/* Tooltip */}
            <span className="absolute left-16 bg-dark-grey text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                Chat with Habibi
            </span>
        </button>
    );
};

export default FloatingActionButton;
