/**
 * ChatInput — Floating recessed AI input box styled after Claude AI interface with Attach (+) and disclaimer text.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Square, Trash2, Plus, Mic, MicOff, Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  onClear?: () => void;
  onAttach?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  onStop,
  onClear,
  onAttach,
  isStreaming,
  disabled = false,
  placeholder = 'Write a message…',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [input]);

  const handleSend = useCallback(() => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming && onStop) {
        onStop();
      } else {
        handleSend();
      }
    }
  };

  const handleVoiceClick = () => {
    if (isRecording) {
      setIsRecording(false);
      toast.success('Voice input captured!');
      setInput((prev) => prev + (prev ? ' ' : '') + 'Summarize the key takeaways from the uploaded document.');
    } else {
      setIsRecording(true);
      toast('Listening… Speak your query into the microphone', { icon: '🎙️' });
    }
  };

  return (
    <div className="w-full px-6 sm:px-10 pb-10 md:pb-12 pt-4 bg-transparent shrink-0 select-none relative z-10 flex justify-center items-center">
      <div className="max-w-[820px] w-full mx-auto">
        {/* Floating Claude-Style Input Container */}
        <div className="relative flex flex-col bg-[#1D1F27] border border-slate-700/80 rounded-[28px] shadow-2xl shadow-black/60 hover:border-slate-600 focus-within:border-indigo-500/80 transition-all p-5">
          
          {/* Recording Banner when Voice is Active */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between px-4 py-2 bg-[#3B1E22] border-b border-red-500/40 rounded-t-[20px] mb-3 text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                  <span className="text-xs font-semibold text-red-300">Recording voice query…</span>
                </div>
                <div className="flex items-center gap-1.5 h-4">
                  {[...Array(6)].map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 bg-red-400 rounded-full animate-pulse`}
                      style={{ height: `${8 + (i % 3) * 4}px` }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Textarea Area with increased text font size and comfort padding */}
          <div className="w-full px-2 py-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full text-base sm:text-[16px] bg-transparent border-none text-slate-100 placeholder-slate-400 resize-none focus:outline-none disabled:opacity-50 font-reading leading-[1.6] max-h-[160px]"
              aria-label="Chat query input"
            />
          </div>

          {/* Bottom Controls Bar inside Box */}
          <div className="flex items-center justify-between gap-3 mt-3 pt-2 px-1 border-t border-slate-800/40">
            {/* Left: Attach (+) button */}
            <div className="flex items-center gap-2">
              <button
                onClick={onAttach || (() => toast('Open the sidebar to upload PDFs, videos & URLs!', { icon: '📎' }))}
                className="p-2 text-slate-300 hover:text-white bg-[#282B34] hover:bg-[#323642] border border-slate-600/70 rounded-2xl transition-all shrink-0 cursor-pointer flex items-center justify-center w-9 h-9 shadow-sm hover:scale-105"
                title="Attach file or document (+)"
                aria-label="Attach source file"
              >
                <Plus className="w-4 h-4 text-indigo-400" />
              </button>
              
              {onClear && (
                <button
                  onClick={() => { onClear(); toast('Conversation cleared', { icon: '🧹' }); }}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-[#282B34] rounded-2xl transition-colors shrink-0 cursor-pointer w-9 h-9 flex items-center justify-center"
                  title="Clear chat history"
                  aria-label="Clear chat history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Right: Model Tag, Voice, & Send Button */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-300 bg-[#262932] px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-inner select-none">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>SamaSocial AI</span>
                <span className="text-slate-400 font-mono">v1.2</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </div>

              <button
                onClick={handleVoiceClick}
                className={`p-2 rounded-2xl transition-colors shrink-0 cursor-pointer w-9 h-9 flex items-center justify-center border ${
                  isRecording
                    ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#282B34] border-transparent'
                }`}
                title={isRecording ? 'Stop recording' : 'Voice query input'}
                aria-label="Toggle voice query input"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {isStreaming ? (
                <button
                  onClick={onStop}
                  className="px-4 py-2 text-xs font-bold bg-[#2C303B] hover:bg-[#373C48] text-slate-200 rounded-2xl transition-all shrink-0 flex items-center gap-2 border border-slate-600 shadow-md cursor-pointer"
                  title="Stop generating"
                  aria-label="Stop generating response"
                >
                  <Square className="w-3.5 h-3.5 fill-current text-red-400" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || disabled}
                  className={`p-2 rounded-2xl transition-all shrink-0 flex items-center justify-center w-9 h-9 shadow-lg ${
                    input.trim() && !disabled
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer scale-105'
                      : 'bg-[#262932] text-slate-600 cursor-not-allowed border border-slate-800'
                  }`}
                  title="Send message"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Muted Disclaimer Beneath Input */}
        <div className="text-center text-xs text-slate-500 mt-3 font-reading select-none">
          SamaSocial AI can make mistakes. Please double-check cited sources and curriculum milestones.
        </div>
      </div>
    </div>
  );
}
