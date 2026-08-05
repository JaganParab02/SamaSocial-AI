/**
 * ChatInput — Floating glassmorphic AI input bar with Attach, Voice waveform recording simulation, and auto-resize.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Square, Trash2, Paperclip, Mic, MicOff, Sparkles } from 'lucide-react';
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
  placeholder = 'Ask anything about your uploaded sources...',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea smoothly up to 150px
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
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
      setInput((prev) => prev + (prev ? ' ' : '') + 'Summarize the key takeaways from the latest document.');
    } else {
      setIsRecording(true);
      toast('Listening... Speak your query into the microphone', { icon: '🎙️' });
    }
  };

  return (
    <div className="p-3 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/95 to-transparent shrink-0">
      <div className="max-w-[900px] mx-auto">
        {/* Floating Glassmorphic Container */}
        <motion.div
          animate={isRecording ? { borderColor: 'rgba(239, 68, 68, 0.6)' } : {}}
          className="relative flex flex-col bg-[#111827]/90 backdrop-blur-2xl border border-slate-700/70 rounded-2xl shadow-2xl transition-all focus-within:border-indigo-500 focus-within:shadow-indigo-500/10 focus-within:ring-1 focus-within:ring-indigo-500/50 p-2"
        >
          {/* Recording Banner when Voice is Active */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between px-3 py-1.5 bg-red-500/15 border-b border-red-500/20 rounded-t-xl mb-1.5 text-red-300"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-semibold">Recording voice query...</span>
                </div>
                <div className="flex items-center gap-1 h-4">
                  {[...Array(6)].map((_, i) => (
                    <span
                      key={i}
                      className={`w-1 bg-red-400 rounded-full animate-wave ${i % 2 === 0 ? 'animate-wave-delay-1' : 'animate-wave-delay-2'}`}
                      style={{ height: '8px' }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-1.5 w-full px-1">
            {/* Attach Source Action */}
            <motion.button
              onClick={onAttach || (() => toast('Expand the sidebar on the left to drag & drop files!', { icon: '📎' }))}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 text-slate-400 hover:text-indigo-400 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors shrink-0 mb-0.5 cursor-pointer"
              title="Attach document or webpage"
              aria-label="Attach source"
            >
              <Paperclip className="w-4 h-4" />
            </motion.button>

            {/* Auto-resizing Textarea */}
            <div className="flex-1 min-w-0 py-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className="w-full px-2 py-1.5 text-sm bg-transparent border-none text-slate-100 placeholder-slate-500 resize-none focus:outline-none disabled:opacity-50 font-medium leading-relaxed max-h-[150px]"
                aria-label="Chat input"
              />
            </div>

            {/* Voice Recording Button */}
            <motion.button
              onClick={handleVoiceClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2.5 rounded-xl transition-all shrink-0 mb-0.5 cursor-pointer ${
                isRecording
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800'
              }`}
              title={isRecording ? 'Stop recording' : 'Voice input'}
              aria-label="Voice input"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </motion.button>

            {/* Clear Conversation Action */}
            {onClear && (
              <motion.button
                onClick={() => { onClear(); toast('Conversation reset', { icon: '🧹' }); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 text-slate-500 hover:text-red-400 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors shrink-0 mb-0.5 cursor-pointer"
                title="Clear chat history"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}

            {/* Send / Stop Streaming Button */}
            {isStreaming ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStop}
                className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors shadow-lg shadow-red-600/30 shrink-0 mb-0.5 cursor-pointer"
                title="Stop AI response"
                aria-label="Stop generating"
              >
                <Square className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: !input.trim() || disabled ? 1 : 1.05 }}
                whileTap={{ scale: !input.trim() || disabled ? 1 : 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || disabled}
                className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-indigo-600/25 shrink-0 mb-0.5 cursor-pointer"
                title="Send query to AI"
                aria-label="Send message"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </motion.button>
            )}
          </div>

          <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Grounded across active vectors in Qdrant
            </span>
            <span>Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">Enter ↵</kbd> to send</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
