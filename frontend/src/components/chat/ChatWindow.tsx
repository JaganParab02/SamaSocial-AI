/**
 * ChatWindow — Conversational window with readable centered container and grounded prompt suggestions.
 */
import { useRef, useEffect, useState } from 'react';
import { ArrowDown, Zap, ArrowUpRight, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const suggestions = [
    { icon: '📄', title: 'Summarize key themes', desc: 'Extract core arguments and takeaways' },
    { icon: '🎥', title: 'Analyze video content', desc: 'Transcribe timestamps & core concepts' },
    { icon: '🌐', title: 'Compare multi-source data', desc: 'Synthesize across docs & web pages' },
    { icon: '🧠', title: 'Generate study questions', desc: 'Create active recall evaluation quizzes' },
    { icon: '📚', title: 'Draft structured notes', desc: 'Format revision flashcards and summaries' },
    { icon: '🔍', title: 'Search citations & definitions', desc: 'Retrieve accurate references with quotes' },
  ];

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center justify-center bg-[var(--bg-canvas)] relative select-none">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-[780px] w-full mx-auto flex flex-col items-center text-center my-auto py-6"
        >
          {/* Emblem */}
          <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-sm mb-5 flex items-center justify-center text-[var(--accent-primary)]">
            <Sparkles className="w-6 h-6" />
          </div>

          {/* Welcome Heading */}
          <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight mb-2 text-[var(--text-primary)]">
            What would you like to explore today?
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-lg mx-auto mb-8 leading-relaxed font-reading">
            Ask grounded questions about your knowledge sources or synthesize structured course modules and learning activities.
          </p>

          {/* 6 Interactive Suggestion Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[660px] w-full">
            {suggestions.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => onSuggestionClick?.(item.title)}
                className="group relative flex items-start justify-between p-3.5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] shadow-sm transition-all cursor-pointer text-left"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-base p-2 rounded-[var(--radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] shrink-0">
                    {item.icon}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-heading font-bold text-[var(--text-primary)] transition-colors truncate">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] leading-snug mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] transition-colors shrink-0 mt-1" />
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-2 font-mono text-[11px] text-[var(--text-tertiary)]">
            <Zap className="w-3 h-3 text-[var(--accent-primary)] fill-current" />
            <span>Powered by Qdrant Vector Search & High-Speed Inference</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden bg-[var(--bg-canvas)]">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto pt-4 pb-6"
      >
        <div className="max-w-[780px] mx-auto space-y-3">
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
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            onClick={scrollToBottom}
            className="absolute bottom-5 right-6 p-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] rounded-full shadow-lg border border-[var(--border-strong)] transition-all cursor-pointer z-20"
            aria-label="Scroll to newest messages"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4 text-[var(--accent-primary)]" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
