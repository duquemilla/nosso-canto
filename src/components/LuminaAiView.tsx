import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Lightbulb,
  Zap,
  BookOpen,
  Film,
  Utensils,
  Code,
  Heart,
} from 'lucide-react';
import { PartnerId, CoupleProfile } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface LuminaAiViewProps {
  profile: CoupleProfile;
  activePartner: PartnerId;
}

const SUGGESTED_PROMPTS = [
  {
    icon: <Utensils className="w-4 h-4 text-amber-500" />,
    label: 'Jantar Rápido',
    text: 'Sugira 3 ideias de jantares práticos, gostosos e românticos de até 30 minutos para 2 pessoas.',
  },
  {
    icon: <Film className="w-4 h-4 text-purple-500" />,
    label: 'Filmes Aconchegantes',
    text: 'Recomende filmes acolhedores (cozy) ou séries envolventes para maratonar no fim de semana.',
  },
  {
    icon: <Lightbulb className="w-4 h-4 text-emerald-500" />,
    label: 'Organização do Lar',
    text: 'Qual a melhor rotina simples para manter o apartamento cheiroso e organizado sem estresse?',
  },
  {
    icon: <Heart className="w-4 h-4 text-rose-500" />,
    label: 'Encontro em Casa',
    text: 'Dê ideias criativas e zero óbvias para um date night especial em casa sem gastar muito.',
  },
  {
    icon: <Code className="w-4 h-4 text-sky-500" />,
    label: 'Dúvidas Gerais & Tech',
    text: 'Explique de forma simples e divertida como funciona a inteligência artificial generativa.',
  },
];

export const LuminaAiView: React.FC<LuminaAiViewProps> = ({ profile, activePartner }) => {
  const currentPartner = profile[activePartner];
  const partnerName = currentPartner.nickname || currentPartner.name;

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('lumina_ai_chat_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: `Olá, ${partnerName}! ✨ Eu sou a **Lumina AI**, a assistente inteligente do *Nosso Canto*.\n\nVocê pode me perguntar absolutamente qualquer coisa: desde dicas culinárias e ideias para o fim de semana, até tirar dúvidas de trabalho, cultura, ciência, tecnologia ou organizar a rotina de vocês. Como posso te ajudar hoje?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('lumina_ai_chat_history', JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          partnerName,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (!response.ok) throw new Error('Falha ao comunicar com a IA');

      const data = await response.json();
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Desculpe, não consegui formular uma resposta no momento.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'Tive um pequeno contratempo de conexão. Verifique sua internet ou tente novamente em alguns instantes!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const fresh: Message[] = [
      {
        id: 'welcome',
        sender: 'ai',
        text: `Conversa reiniciada! 🌸 Oi ${partnerName}, sobre o que gostaria de conversar ou pesquisar agora?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(fresh);
    try {
      localStorage.removeItem('lumina_ai_chat_history');
    } catch {}
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] max-w-4xl mx-auto rounded-3xl bg-white dark:bg-[#20181D] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2E8E4] dark:border-[#3D2F36] bg-[#FAF8F5]/80 dark:bg-[#261E23]/80 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
                Lumina AI
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Gemini 3.8
              </span>
            </div>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Assistente inteligente para perguntas livres, receitas, estudos e dia a dia
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="p-2 rounded-xl text-[#7D6F74] dark:text-[#B8A8AF] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-xs flex items-center gap-1.5"
          title="Limpar histórico"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Reiniciar</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`relative max-w-[85%] sm:max-w-[78%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#E07A8B] text-white rounded-tr-xs shadow-xs'
                    : 'bg-[#FAF8F5] dark:bg-[#2A2026] text-[#2D2327] dark:text-[#FAF4F0] border border-[#F2E8E4] dark:border-[#3D2F36] rounded-tl-xs shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans space-y-2">
                  {msg.text.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>

                <div
                  className={`mt-2 flex items-center justify-between text-[10px] gap-2 pt-1 border-t ${
                    isUser
                      ? 'border-white/20 text-white/80'
                      : 'border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF]'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(msg.id, msg.text)}
                      className="hover:text-[#E07A8B] transition-colors flex items-center gap-1"
                      title="Copiar texto"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-950 flex items-center justify-center text-sm shrink-0 mt-1">
                  {currentPartner.avatar || '👩🏻'}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#FAF8F5] dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] p-4 rounded-3xl rounded-tl-xs text-xs text-[#7D6F74] dark:text-[#B8A8AF] flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#E07A8B] animate-ping" />
              <span>Lumina AI está pensando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts carousel */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-[#F2E8E4] dark:border-[#3D2F36] bg-[#FAF8F5]/40 dark:bg-[#241C21]/40 overflow-x-auto scrollbar-none flex gap-2 shrink-0">
          {SUGGESTED_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.text)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] text-[11px] font-medium text-[#2D2327] dark:text-[#FAF4F0] hover:border-[#E07A8B] hover:text-[#E07A8B] transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            >
              {p.icon}
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="p-3 sm:p-4 border-t border-[#F2E8E4] dark:border-[#3D2F36] bg-white dark:bg-[#20181D] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Pergunte algo para a Lumina AI, ${partnerName}...`}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs sm:text-sm text-[#2D2327] dark:text-[#FAF4F0] focus:ring-2 focus:ring-[#E07A8B] focus:border-transparent outline-hidden transition-all placeholder:text-[#7D6F74]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-2xl bg-[#E07A8B] hover:bg-[#d66a7c] disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 shadow-xs cursor-pointer active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
