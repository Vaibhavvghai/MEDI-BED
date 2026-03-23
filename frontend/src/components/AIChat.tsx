import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useStore } from '../store';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const AIChat = () => {
  const [messages, setMessages] = useState<{ role: 'model' | 'user'; text: string }[]>([
    { role: 'model', text: 'Hello! I am your MediBed AI Assistant. How can I help you today with your medical data or ward overview?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { activeUser } = useStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: `You are MediBed AI Assistant. The current user is a ${activeUser?.role || 'Guest'} named ${activeUser?.name || 'Unknown'}. Keep responses helpful, concise, and related to hospital management, ward beds, patient status, or general medical scheduling assistance.` },
            ...messages.map(m => ({
              role: m.role === 'model' ? 'assistant' : 'user',
              content: m.text
            })),
            { role: "user", content: userMsg }
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Error from Groq AI');

      const aiText = data.choices[0]?.message?.content || "I couldn't process that.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
       console.error(error);
       setMessages(prev => [...prev, { role: 'model', text: "Sorry, I am facing connectivity issues right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] shadow-card border border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-yellow-400">
          <Bot size={24} />
        </div>
        <div>
           <h3 className="font-bold text-gray-900 text-lg tracking-tight">AI Health Counselor</h3>
           <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Llama 3.3 • Persistent Session</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 pb-4 custom-scrollbar">
        <div className="flex flex-col gap-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
               {msg.role === 'model' && (
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-black shrink-0 mt-1 border border-gray-100">
                     <Bot size={20} />
                  </div>
               )}
               <div className={`p-5 rounded-[24px] max-w-[75%] shadow-sm ${
                 msg.role === 'user' 
                   ? 'bg-black text-white rounded-tr-sm' 
                   : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
               }`}>
                 <p className="text-[14px] font-medium leading-relaxed break-words">{msg.text}</p>
               </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-black shrink-0 mt-1 border border-gray-100">
                 <Bot size={20} />
              </div>
              <div className="p-5 rounded-[24px] bg-white border border-gray-100 text-gray-800 rounded-tl-sm flex items-center gap-1.5 h-[52px]">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-6 bg-white border-t border-gray-50">
         <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto w-full">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How can I assist you with your health today?" 
              disabled={isLoading}
              className="w-full bg-gray-50 border-none rounded-[24px] pl-8 pr-16 py-5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all"
            />
            <button 
               type="submit" 
               disabled={!input.trim() || isLoading}
               className="absolute right-2 w-12 h-12 flex items-center justify-center bg-black hover:scale-105 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
               <Send size={18} className="-ml-0.5" />
            </button>
         </form>
      </div>
    </div>
  );
};
