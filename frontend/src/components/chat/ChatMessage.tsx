/**
 * ChatMessage — AI SaaS message bubble with interactive action strip (Copy, Regenerate, Like, Dislike) & citations.
 */
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, AlertCircle, Copy, Check, RefreshCw, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import CitationCard from './CitationCard';
import type { ChatMessageUI } from '../../types/api';

interface ChatMessageProps {
  message: ChatMessageUI;
  onRegenerate?: () => void;
}

export default function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied AI response to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    setLiked(!liked);
    if (!liked) {
      setDisliked(false);
      toast.success('Thank you for your feedback!');
    }
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (!disliked) {
      setLiked(false);
      toast('Feedback noted for future response grounding', { icon: '🛠️' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`w-full py-2 ${isUser ? 'flex justify-end px-4' : 'px-4 lg:px-6'}`}
    >
      <div className={`flex gap-3.5 max-w-[900px] w-full mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}>
        {/* Assistant Avatar */}
        {!isUser && (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-teal-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400 shadow-md">
            {message.isError ? <AlertCircle className="w-5 h-5 text-red-400" /> : <Bot className="w-5 h-5 text-indigo-400" />}
          </div>
        )}

        {/* Message Bubble & Cards */}
        <div
          className={`flex-1 min-w-0 ${
            isUser
              ? 'max-w-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-tr-sm p-4 shadow-md shadow-indigo-600/15 font-medium leading-relaxed text-sm'
              : 'bg-[#111827] border border-slate-800/80 rounded-2xl rounded-tl-sm p-5 shadow-lg shadow-black/20 text-slate-100'
          }`}
        >
          {/* Role Header */}
          {!isUser && (
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> SamaSocial AI Assistant
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {/* Core Content */}
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className={`markdown-body ${message.isStreaming ? 'streaming-cursor' : ''}`}>
              {message.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              ) : message.isStreaming ? (
                <div className="flex items-center gap-2 text-indigo-400 py-1">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full" style={{ animation: 'pulse-dot 1.4s infinite 0s' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full" style={{ animation: 'pulse-dot 1.4s infinite 0.2s' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full" style={{ animation: 'pulse-dot 1.4s infinite 0.4s' }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">Searching vector embeddings & analyzing...</span>
                </div>
              ) : (
                <span className="text-slate-500 italic">Empty response</span>
              )}
            </div>
          )}

          {/* Grounding Citations */}
          {!isUser && Array.isArray(message.citations) && message.citations.length > 0 && !message.isStreaming && (
            <div className="mt-4 pt-3.5 border-t border-slate-800/90">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                📚 Grounded Citations & Sources
              </span>
              <div className="flex flex-wrap gap-1.5">
                {message.citations.map((citation, i) => (
                  <CitationCard key={`${citation.source_id}-${i}`} citation={citation} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Interactive Action Bar for AI Answers */}
          {!isUser && !message.isStreaming && message.content && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60 text-xs">
              <div className="flex items-center gap-1 text-slate-400">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 hover:bg-slate-800 rounded-md text-slate-300 transition-colors cursor-pointer"
                  title="Copy response"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </motion.button>

                {onRegenerate && (
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { onRegenerate(); toast('Regenerating answer from Qdrant vectors...', { icon: '🔄' }); }}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-slate-800 rounded-md text-slate-300 transition-colors cursor-pointer"
                    title="Regenerate answer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </motion.button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    liked ? 'text-emerald-400 bg-emerald-500/15' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                  title="Accurate response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDislike}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    disliked ? 'text-red-400 bg-red-500/15' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                  title="Needs improvement"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        {isUser && (
          <div className="w-9 h-9 rounded-xl bg-indigo-600 border border-indigo-400/30 flex items-center justify-center shrink-0 text-white shadow-md">
            <User className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
