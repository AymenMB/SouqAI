
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Language } from '../types';
import { translations } from '../i18n';

interface HabibiChatProps {
  lang: Language;
}

const HabibiChat: React.FC<HabibiChatProps> = ({ lang }) => {
  const t = translations[lang].chat;
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: t.welcome, timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  // Re-initialize chat when language changes to set correct system instruction
  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let instruction = `You are "Habibi", a smart, witty, and helpful AI shopping assistant for SouqAI (Tunisia).`;
    if (lang === 'ar') {
      instruction += ` You MUST speak in Tunisian Dialect (Derja) primarily, mixed with some French/English tech terms. Be very friendly like a Tunisian shopkeeper.`;
    } else if (lang === 'fr') {
      instruction += ` You MUST speak in French. Be polite and helpful.`;
    } else {
      instruction += ` You mix English with Tunisian words (Aslema, Labes, Barcha). Keep it friendly.`;
    }
    instruction += ` Your goal is to help users buy things. If suggesting a product, format it nicely with bullet points.`;

    chatSessionRef.current = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: instruction,
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    // Reset messages on lang change, or just keep history? 
    // Better UX to keep history but append a new welcome message in new lang.
    // For simplicity, we append a new system welcome message.
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      role: 'model', 
      text: t.welcome, 
      timestamp: Date.now() 
    }]);

  }, [lang]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textInput: string = input) => {
    if (!textInput.trim() || isLoading || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textInput,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '', timestamp: Date.now(), isThinking: true }]);

      const resultStream = await chatSessionRef.current.sendMessageStream({ message: userMsg.text });
      
      let fullResponseText = '';
      for await (const chunk of resultStream) {
        const text = chunk.text;
        if (text) {
           fullResponseText += text;
           setMessages(prev => prev.map(msg => 
             msg.id === botMsgId 
               ? { ...msg, text: fullResponseText, isThinking: false } 
               : msg
           ));
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(msg => 
         msg.isThinking 
           ? { ...msg, text: t.error, isThinking: false } 
           : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 ring-1 ring-slate-900/5">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
             <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-500 to-orange-400 p-0.5">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <span className="text-xl">👳‍♂️</span>
                </div>
             </div>
             <div className="absolute bottom-0 right-0 rtl:left-0 rtl:right-auto w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{t.title}</h3>
            <p className="text-xs text-slate-500 font-medium">{t.subtitle}</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
               {/* Avatar for bot only */}
               {msg.role === 'model' && (
                 <div className="w-8 h-8 rounded-full bg-red-100 flex-shrink-0 flex items-center justify-center text-xs mt-1">H</div>
               )}
               
               <div className={`p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-red-600 text-white rounded-tr-none rtl:rounded-tr-2xl rtl:rounded-tl-none' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none rtl:rounded-tl-2xl rtl:rounded-tr-none'
               }`}>
                 {msg.isThinking ? (
                   <div className="flex items-center gap-3">
                     <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.thinking}</span>
                     <div className="flex gap-1">
                       <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"></div>
                       <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce delay-75"></div>
                       <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce delay-150"></div>
                     </div>
                   </div>
                 ) : (
                   <div className="whitespace-pre-wrap" dir="auto">{msg.text}</div>
                 )}
               </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips */}
      {messages.length < 3 && (
        <div className="px-6 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {t.prompts.map((prompt, i) => (
            <button 
              key={i}
              onClick={() => handleSend(prompt)}
              className="whitespace-nowrap px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-full hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors shadow-sm"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative flex items-center bg-slate-100 rounded-2xl px-2 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-transparent border border-transparent">
          <button className="p-3 text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            className="flex-1 bg-transparent py-4 px-2 outline-none text-slate-800 placeholder:text-slate-400"
            disabled={isLoading}
            autoFocus
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="p-2 m-1 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/30 rtl:rotate-180"
          >
            <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabibiChat;
