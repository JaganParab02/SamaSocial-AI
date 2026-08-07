/**
 * ChatMessage — Minimalist message presentation styled after Claude interface with rounded user card and clean editorial assistant typography.
 */
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, AlertCircle, Copy, Check, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';
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
      toast('Feedback noted for future grounding', { icon: '🛠️' });
    }
  };

  // Parse <think>...</think> blocks from content
  let displayContent = message.content || '';
  let thinkContent = '';
  
  if (!isUser && displayContent) {
    const thinkStart = displayContent.indexOf('<think>');
    if (thinkStart !== -1) {
      const thinkEnd = displayContent.indexOf('</think>', thinkStart);
      if (thinkEnd !== -1) {
        thinkContent = displayContent.slice(thinkStart + 7, thinkEnd).trim();
        displayContent = (displayContent.slice(0, thinkStart) + displayContent.slice(thinkEnd + 8)).trim();
      } else {
        // Unclosed think tag (streaming in progress)
        thinkContent = displayContent.slice(thinkStart + 7).trim();
        displayContent = displayContent.slice(0, thinkStart).trim();
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`w-full py-3.5 px-4 sm:px-6 flex justify-center ${isUser ? 'mt-4' : ''}`}
    >
      <div className={`flex gap-4 max-w-[780px] w-full mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}>
        {/* Avatar (Left) - Only for Assistant */}
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-[#26282E] border border-slate-700/70 flex items-center justify-center shrink-0 text-indigo-400 shadow-sm mt-0.5">
            {message.isError ? <AlertCircle className="w-4 h-4 text-red-400" /> : <Bot className="w-4 h-4" />}
          </div>
        )}

        {/* Message Content Container */}
        <div className={`flex flex-col min-w-0 ${isUser ? 'flex-1 items-end' : 'flex-1 w-full'}`}>
          {/* User Message */}
          {isUser ? (
            <div className="bg-[#2f2f2f] text-slate-100 rounded-3xl px-5 py-3 shadow-sm font-reading text-[15px] leading-relaxed whitespace-pre-wrap max-w-[85%] md:max-w-[75%]">
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-2 pb-2 border-b border-slate-700/60">
                  {message.attachments.map((att, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181A22] text-xs text-indigo-300 font-mono border border-slate-700 shadow-xs">
                      <span>{att.type === 'youtube' ? '🎥' : att.type === 'url' ? '🔗' : '📄'}</span>
                      <span className="truncate max-w-[180px]">{att.name}</span>
                    </span>
                  ))}
                </div>
              )}
              {message.content}
            </div>
          ) : message.isError ? (
            /* Unified Error Card Pattern with Retry CTA */
            <div className="bg-[#3A181D]/90 border border-red-500/60 rounded-2xl p-4 shadow-sm text-slate-200 my-1">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-heading font-bold text-red-400 uppercase tracking-wider mb-1">
                    Generation Failed
                  </h4>
                  <p className="text-xs text-slate-300 font-reading leading-relaxed mb-3">
                    {message.content || 'An unexpected streaming or vector retrieval error occurred while communicating with the language model.'}
                  </p>
                  {onRegenerate && (
                    <button
                      onClick={() => { onRegenerate(); toast('Retrying request…', { icon: '🔄' }); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#2A1518] hover:bg-[#3D1D21] text-slate-200 border border-red-500/50 rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                      <span>Retry Request</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Assistant Response (Clean editorial presentation without distracting bounding headers) */
            <div className="text-slate-100 text-[15px] font-reading leading-[1.65] space-y-4 pt-0.5">
              
              {/* Markdown Core Content */}
              <div className={`markdown-body ${message.isStreaming ? 'streaming-cursor' : ''}`}>
                
                {/* Collapsible Think Block */}
                {thinkContent && (
                  <details className="mb-4 bg-[#26282E] rounded-lg border border-slate-700/60 overflow-hidden group">
                    <summary className="px-4 py-2.5 cursor-pointer text-xs font-semibold text-slate-400 bg-[#1E2025] hover:bg-[#2A2D34] transition-colors flex items-center select-none list-none">
                      <div className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 text-indigo-400" />
                          {message.isStreaming && !message.content?.includes('</think>') ? 'AI is thinking...' : 'Thought Process'}
                        </span>
                        <span className="text-slate-500 opacity-60 text-[10px]">Click to expand</span>
                      </div>
                    </summary>
                    <div className="px-4 py-3 text-[13px] text-slate-400 font-mono whitespace-pre-wrap max-h-[400px] overflow-y-auto leading-relaxed opacity-90 border-t border-slate-700/60">
                      {thinkContent}
                    </div>
                  </details>
                )}

                {displayContent ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
                ) : message.isStreaming && !thinkContent ? (
                  <div className="flex items-center gap-2.5 text-indigo-400 py-2">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                    <span className="text-xs font-medium text-slate-400">Thinking & retrieving references…</span>
                  </div>
                ) : (
                  <span className="text-slate-500 italic text-xs">Empty response generated.</span>
                )}
              </div>

              {/* Grounded Citations formatted like Claude Artifact / Document Chips */}
              {Array.isArray(message.citations) && message.citations.length > 0 && !message.isStreaming && (
                <div className="mt-5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-[620px]">
                    {message.citations.map((citation, i) => (
                      <CitationCard key={`${citation.source_id || i}`} citation={citation} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Minimalist Transparent Action Bar underneath answer */}
              {!message.isStreaming && (displayContent || thinkContent) && (
                <div className="flex items-center gap-2 pt-2 text-slate-400 text-xs opacity-70 hover:opacity-100 transition-opacity select-none">
                  <button
                    onClick={handleCopy}
                    aria-label="Copy AI response"
                    className="p-1.5 hover:bg-[#2A2D34] hover:text-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    title="Copy response to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleLike}
                    aria-label="Helpful response"
                    className={`p-1.5 hover:bg-[#2A2D34] rounded-lg transition-colors cursor-pointer ${liked ? 'text-emerald-400 bg-emerald-500/10' : 'hover:text-slate-200'}`}
                    title="Good response"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDislike}
                    aria-label="Unhelpful response"
                    className={`p-1.5 hover:bg-[#2A2D34] rounded-lg transition-colors cursor-pointer ${disliked ? 'text-red-400 bg-red-500/10' : 'hover:text-slate-200'}`}
                    title="Poor response"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                  {onRegenerate && (
                    <button
                      onClick={() => { onRegenerate(); toast('Regenerating response…', { icon: '✨' }); }}
                      aria-label="Regenerate response"
                      className="p-1.5 hover:bg-[#2A2D34] hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Regenerate answer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
