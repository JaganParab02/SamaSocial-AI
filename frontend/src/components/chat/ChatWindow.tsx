/**
 * ChatWindow — Premium AI SaaS conversational window with 900px maximum readable width and AI landing screen.
 */
import { useRef, useEffect, useState } from 'react';
import { ArrowDown, Zap, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from './ChatMessage';
import type { ChatMessageUI } from '../../types/api';

interface ChatWindowProps {
  messages: ChatMessageUI[];
  isStreaming: boolean;
  onSuggestionClick?: (query: string) => void;
  onRegenerateLast?: () => void;
}

export default function ChatWindow({ messages, isStreaming, onSuggestionClick, onRegenerateLast }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto-scroll when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const suggestions = [
    { icon: '📄', title: 'Summarize this PDF', desc: 'Extract key themes and actionable notes' },
    { icon: '🎥', title: 'Explain this YouTube video', desc: 'Transcribe timestamps & core takeaways' },
    { icon: '🌐', title: 'Compare multiple sources', desc: 'Synthesize across docs, sites & slides' },
    { icon: '🧠', title: 'Generate quiz questions', desc: 'Create active recall study tests' },
    { icon: '📚', title: 'Create study notes', desc: 'Format bulleted revision flashcards' },
    { icon: '🔍', title: 'Find key concepts', desc: 'Retrieve definitions with citation links' },
  ];

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center justify-center bg-[#0B1120] relative">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-[900px] w-full mx-auto flex flex-col items-center text-center z-10 my-auto py-6"
        >
          {/* Glowing AI Centerpiece Emblem */}
          <motion.div
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-rose-500 p-0.5 shadow-2xl shadow-indigo-500/30 mb-6 flex items-center justify-center"
          >
            <div className="w-full h-full bg-[#0B1120] rounded-[22px] flex items-center justify-center text-3xl">
              🧠
            </div>
          </motion.div>

          {/* Welcome Heading */}
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-3 text-slate-100">
            What would you like to learn today?
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#9CA3AF] max-w-xl mx-auto mb-10 leading-relaxed font-normal">
            Upload documents, websites, or YouTube videos and ask questions grounded directly in your sources.
          </p>

          {/* 6 Interactive Suggestion Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl w-full">
            {suggestions.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSuggestionClick?.(item.title)}
                className="group relative flex items-start justify-between p-4 rounded-2xl bg-[#111827]/90 hover:bg-[#1F2937] border border-slate-800 hover:border-indigo-500/60 shadow-md transition-all cursor-pointer text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl p-2 rounded-xl bg-slate-900/80 border border-slate-800 group-hover:border-indigo-500/30 transition-colors shrink-0">
                    {item.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-[#9CA3AF] leading-snug mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-2 text-xs font-medium text-slate-500">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span>Powered by Qdrant Vector Retrieval & Groq High-Speed Llama 3</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden bg-[#0B1120]">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto pt-4 pb-6"
      >
        <div className="max-w-[900px] mx-auto space-y-2">
          {messages.map((msg, index) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onRegenerate={index === messages.length - 1 && msg.role === 'assistant' ? onRegenerateLast : undefined}
            />
          ))}
        </div>
        <div ref={bottomRef} className="h-6" />
      </div>

      {/* Scroll to bottom FAB */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-5 right-6 p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full shadow-xl shadow-indigo-600/30 transition-all border border-white/10 cursor-pointer z-20"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
