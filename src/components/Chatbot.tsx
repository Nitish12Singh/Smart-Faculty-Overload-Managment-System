import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types/index.ts';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Minimize2,
  Maximize2,
  HelpCircle,
  Shield,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface ChatbotProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const Chatbot: React.FC<ChatbotProps> = ({ user, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${user.name}! I am **FacultyAssist**, your academic workload companion. You are logged in as **${user.role.toUpperCase()}**.\n\nAsk me about your workload, overload limits, assigned courses, or how our DSA balancing algorithm functions!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions =
    user.role === 'faculty'
      ? [
          'What is my current workload?',
          'Am I overloaded?',
          'How many hours can I still take?',
          'Show my assigned courses.',
          'How can I request workload reduction?',
          'Explain my workload percentage.',
          'How does workload balancing work?',
        ]
      : [
          'Who has the lowest workload in my department?',
          'How many faculty are overloaded?',
          'How does workload balancing work?',
          'What is the maximum workload limit?',
          'Explain my workload percentage.',
        ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(textToSend.trim());
      const botMsg: Message = {
        id: `msg_${Date.now()}_b`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_err`,
          sender: 'assistant',
          text: `⚠️ Apologies, could not process request: ${err.message || 'System error'}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${
        isExpanded
          ? 'w-[95vw] sm:w-[540px] h-[75vh]'
          : 'w-[92vw] sm:w-[420px] h-[580px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-800 text-white p-3.5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20">
            <Bot className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm leading-none">FacultyAssist AI</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <span className="text-[11px] text-indigo-200 block mt-0.5">
              Role: {user.role.toUpperCase()} • DSA Intelligent Helper
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-indigo-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Questions Carousel */}
      <div className="bg-slate-50 border-b border-slate-200/80 p-2.5 overflow-x-auto flex gap-1.5 scrollbar-none shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1 px-1 flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-indigo-500" /> Quick:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-[11px] bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 shrink-0 transition-colors shadow-2xs font-medium"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-gradient-to-b from-slate-50/50 to-white text-xs">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed font-sans">
                  {m.text}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {m.timestamp}
              </span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>FacultyAssist is analyzing system workload records...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          placeholder="Ask FacultyAssist anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl transition-all shadow-xs disabled:cursor-not-allowed"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
