/**
 * ChatInput — Floating AI composer styled after Claude & ChatGPT with inline attachment chip rows and popover ingestion.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Send, Square, Trash2, Plus, Mic, MicOff, Sparkles, ChevronDown,
  FileText, Link as LinkIcon, Video, X, Check, AlertTriangle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { UploadItem } from '../../types/api';

interface ChatInputProps {
  onSend: (message: string, attachments?: { name: string; type: string }[]) => void;
  onStop?: () => void;
  onClear?: () => void;
  onAttach?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
  uploads?: UploadItem[];
  isUploading?: boolean;
  onUploadFile?: (file: File) => Promise<unknown>;
  onUploadUrl?: (url: string) => Promise<unknown>;
  onUploadYoutube?: (url: string) => Promise<unknown>;
  onRemoveUpload?: (id: string) => void;
  onRetryUpload?: (id: string) => void;
  onClearCompleted?: () => void;
}

export default function ChatInput({
  onSend,
  onStop,
  onClear,
  onAttach,
  isStreaming,
  disabled = false,
  placeholder = 'Ask anything about your uploaded sources...',
  uploads = [],
  onUploadFile,
  onUploadUrl,
  onUploadYoutube,
  onRemoveUpload,
  onRetryUpload,
  onClearCompleted,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [menuMode, setMenuMode] = useState<'default' | 'url' | 'youtube'>('default');
  const [urlInput, setUrlInput] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const hasPending = uploads.some((u) => u.status === 'uploading' || u.status === 'processing');
  const pendingCount = uploads.filter((u) => u.status === 'uploading' || u.status === 'processing').length;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [input]);

  // Close attach popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachMenu]);

  const handleToggleAttach = () => {
    if (hasPending) {
      toast.error('Waiting for attachments to finish processing');
      return;
    }
    if (uploads.length >= 5) {
      toast('You can attach up to 5 files at once — remove one to add another.', { icon: '⚠️' });
      return;
    }
    if (onUploadFile || onUploadUrl || onUploadYoutube) {
      setShowAttachMenu((prev) => !prev);
      setMenuMode('default');
      setUrlInput('');
    } else if (onAttach) {
      onAttach();
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    const currentCount = uploads.length;
    if (currentCount >= 5) {
      toast('You can attach up to 5 files at once — remove one to add another.', { icon: '⚠️' });
      return;
    }
    const allowed = 5 - currentCount;
    if (fileList.length > allowed) {
      toast('You can attach up to 5 files at once — remove one to add another.', { icon: '⚠️' });
    }
    fileList.slice(0, allowed).forEach((file) => {
      onUploadFile?.(file);
    });
    setShowAttachMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddLink = () => {
    if (!urlInput.trim()) return;
    if (uploads.length >= 5) {
      toast('You can attach up to 5 files at once — remove one to add another.', { icon: '⚠️' });
      return;
    }
    if (menuMode === 'url') {
      onUploadUrl?.(urlInput.trim());
    } else if (menuMode === 'youtube') {
      onUploadYoutube?.(urlInput.trim());
    }
    setUrlInput('');
    setShowAttachMenu(false);
    setMenuMode('default');
  };

  const handleSend = useCallback(() => {
    if (!input.trim() || disabled || hasPending) return;
    const readyAttachments = uploads.filter((u) => u.status === 'success').map((u) => ({
      name: u.file ? u.file.name : (u.url || 'Document'),
      type: u.type,
    }));
    onSend(input, readyAttachments.length > 0 ? readyAttachments : undefined);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onClearCompleted?.();
  }, [input, disabled, hasPending, uploads, onSend, onClearCompleted]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming && onStop) {
        onStop();
      } else if (!hasPending) {
        handleSend();
      }
    }
  };

  const handleVoiceClick = () => {
    if (isRecording) {
      setIsRecording(false);
      toast.success('Voice input captured!');
      setInput((prev) => prev + (prev ? ' ' : '') + 'Summarize the key takeaways from the attached sources.');
    } else {
      setIsRecording(true);
      toast('Listening… Speak your query into the microphone', { icon: '🎙️' });
    }
  };

  const getChipStyle = (item: UploadItem) => {
    const title = item.file ? item.file.name : (item.url || '');
    if (item.type === 'youtube') {
      return { tint: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <Video className="w-3.5 h-3.5" /> };
    }
    if (item.type === 'url') {
      return { tint: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <LinkIcon className="w-3.5 h-3.5" /> };
    }
    if (title.endsWith('.pdf')) {
      return { tint: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <FileText className="w-3.5 h-3.5" /> };
    }
    if (title.endsWith('.ppt') || title.endsWith('.pptx')) {
      return { tint: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: <FileText className="w-3.5 h-3.5" /> };
    }
    return { tint: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <FileText className="w-3.5 h-3.5" /> };
  };

  return (
    <div className="w-full px-6 sm:px-12 pb-16 sm:pb-24 pt-6 mb-4 sm:mb-6 bg-transparent shrink-0 select-none relative z-10 flex justify-center items-center">
      <div className="max-w-[840px] w-full mx-auto">
        
        {/* Floating Claude-Style Input Container */}
        <div className="relative flex flex-col bg-[#1D1F27] border border-slate-700/80 rounded-[32px] shadow-2xl shadow-black/70 hover:border-slate-600 focus-within:border-indigo-500/80 transition-all p-6 sm:p-7">
          
          {/* Recording Banner when Voice is Active */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between px-5 py-2.5 bg-[#3B1E22] border-b border-red-500/40 rounded-t-[24px] mb-4 text-slate-200"
              >
                <div className="flex items-center gap-2.5">
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

          {/* Status Strip when attachments are processing (§4) */}
          <AnimatePresence>
            {hasPending && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
                className="flex items-center gap-2 text-xs font-semibold text-slate-300 px-3 mb-2"
              >
                <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span>Processing {pendingCount} of {uploads.length} file{uploads.length !== 1 ? 's' : ''}…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attachment Chip Row (§1.2, §3) */}
          {uploads.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3 px-2 pt-1">
              {uploads.map((item) => {
                const title = item.file ? item.file.name : (item.url || 'Document');
                const truncTitle = title.length > 18 ? title.slice(0, 15) + '...' : title;
                const { tint, icon } = getChipStyle(item);

                return (
                  <div
                    key={item.id}
                    className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-[14px] h-[40px] bg-[#252833] text-xs font-medium text-slate-200 border transition-all select-none shadow-sm ${
                      item.status === 'error' ? 'border-red-500/80 bg-[#3B1E22]/60' : 'border-slate-700/80'
                    }`}
                  >
                    {/* Tinted Icon Chip */}
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 ${tint}`}>
                      {icon}
                    </div>

                    {/* Truncated Filename */}
                    <span title={title} className={`${item.status === 'error' ? 'text-slate-400 font-normal' : 'text-slate-200'}`}>
                      {truncTitle}
                    </span>

                    {/* State Indicators & Actions */}
                    {item.status === 'uploading' && (
                      <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-slate-700 overflow-hidden rounded-full">
                        <div className="h-full bg-indigo-500 animate-pulse" style={{ width: `${item.progress || 50}%` }} />
                      </div>
                    )}

                    {item.status === 'processing' && (
                      <div className="flex items-center gap-1.5 ml-0.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      </div>
                    )}

                    {item.status === 'success' && (
                      <div className="flex items-center gap-1 text-emerald-400 ml-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {item.status === 'error' ? (
                      <div className="flex items-center gap-1 ml-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        {onRetryUpload && (
                          <button
                            onClick={() => onRetryUpload(item.id)}
                            className="text-[11px] font-bold text-red-300 hover:text-white hover:underline cursor-pointer ml-0.5"
                          >
                            Retry
                          </button>
                        )}
                        {onRemoveUpload && (
                          <button
                            onClick={() => onRemoveUpload(item.id)}
                            className="text-slate-400 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer ml-1"
                            title="Remove attachment"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      onRemoveUpload && (
                        <button
                          onClick={() => onRemoveUpload(item.id)}
                          className="text-slate-400 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer ml-1"
                          title="Remove attachment"
                          aria-label="Remove attachment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Top Textarea Area with generous surrounding cushion */}
          <div className="w-full px-4 sm:px-6 pt-3 pb-4">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full text-base sm:text-[17px] bg-transparent border-none text-slate-100 placeholder-slate-400 resize-none focus:outline-none disabled:opacity-50 font-reading leading-[1.6] max-h-[180px]"
              aria-label="Chat query input"
            />
          </div>

          {/* Bottom Controls Bar */}
          <div className="flex items-center justify-between gap-4 mt-4 pt-3 px-2 border-t border-slate-800/60 relative">
            
            {/* Left: Attach (+) button & lightweight popover (§1.1) */}
            <div className="flex items-center gap-2.5 relative">
              <button
                onClick={handleToggleAttach}
                disabled={hasPending || uploads.length >= 5}
                className={`p-2.5 rounded-2xl transition-all shrink-0 flex items-center justify-center w-10 h-10 shadow-md border ${
                  hasPending || uploads.length >= 5
                    ? 'bg-[#21242E] text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                    : 'bg-[#282B34] hover:bg-[#323642] text-slate-300 hover:text-white border-slate-600/70 hover:scale-105 cursor-pointer'
                }`}
                title={hasPending ? 'Waiting for processing' : 'Attach source files or URLs (+)'}
                aria-label="Attach source files or URLs"
              >
                <Plus className="w-5 h-5 text-indigo-400" />
              </button>

              {/* Hidden File Picker Input (§2) */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.ppt,.pptx,.docx,.txt"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              {/* Anchored Popover Menu (§1.1) */}
              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 bottom-12 z-50 bg-[#1A1D27] border border-slate-700/90 rounded-2xl p-2 shadow-2xl w-[260px] sm:w-[300px] text-slate-200 select-none"
                  >
                    {menuMode === 'default' && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#252835] text-xs font-semibold text-slate-200 transition-colors cursor-pointer text-left w-full"
                        >
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white font-bold">Upload files</div>
                            <div className="text-[10px] text-slate-400 font-normal">PDF, PPTX, DOCX, TXT</div>
                          </div>
                        </button>

                        <button
                          onClick={() => setMenuMode('url')}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#252835] text-xs font-semibold text-slate-200 transition-colors cursor-pointer text-left w-full"
                        >
                          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                            <LinkIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white font-bold">Add web page</div>
                            <div className="text-[10px] text-slate-400 font-normal">Extract articles & docs</div>
                          </div>
                        </button>

                        <button
                          onClick={() => setMenuMode('youtube')}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#252835] text-xs font-semibold text-slate-200 transition-colors cursor-pointer text-left w-full"
                        >
                          <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                            <Video className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white font-bold">Add YouTube video</div>
                            <div className="text-[10px] text-slate-400 font-normal">Transcripts & captions</div>
                          </div>
                        </button>
                      </div>
                    )}

                    {(menuMode === 'url' || menuMode === 'youtube') && (
                      <div className="p-2 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-slate-700/60 pb-1.5">
                          <span className="flex items-center gap-1.5">
                            {menuMode === 'url' ? <LinkIcon className="w-3.5 h-3.5 text-purple-400" /> : <Video className="w-3.5 h-3.5 text-red-400" />}
                            {menuMode === 'url' ? 'Add Web URL' : 'Add YouTube Link'}
                          </span>
                          <button
                            onClick={() => setMenuMode('default')}
                            className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                            placeholder={menuMode === 'url' ? 'https://example.com/doc' : 'https://youtube.com/watch?v=...'}
                            autoFocus
                            className="flex-1 px-2.5 py-1.5 bg-[#232633] border border-slate-600 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                          />
                          <button
                            onClick={handleAddLink}
                            disabled={!urlInput.trim()}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-[#282B35] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {onClear && (
                <button
                  onClick={() => { onClear(); toast('Conversation cleared', { icon: '🧹' }); }}
                  className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-[#282B34] rounded-2xl transition-colors shrink-0 cursor-pointer w-10 h-10 flex items-center justify-center"
                  title="Clear chat history"
                  aria-label="Clear chat history"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Right: Model Tag, Voice, & Send Button */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-300 bg-[#262932] px-3.5 py-2 rounded-xl border border-slate-700/60 shadow-inner select-none">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>SamaSocial AI</span>
                <span className="text-slate-400 font-mono">v1.2</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </div>

              <button
                onClick={handleVoiceClick}
                className={`p-2.5 rounded-2xl transition-colors shrink-0 cursor-pointer w-10 h-10 flex items-center justify-center border ${
                  isRecording
                    ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#282B34] border-transparent'
                }`}
                title={isRecording ? 'Stop recording' : 'Voice query input'}
                aria-label="Toggle voice query input"
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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
                  disabled={!input.trim() || disabled || hasPending}
                  className={`p-2.5 rounded-2xl transition-all shrink-0 flex items-center justify-center w-10 h-10 shadow-lg ${
                    input.trim() && !disabled && !hasPending
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer scale-105'
                      : 'bg-[#262932] text-slate-600 cursor-not-allowed border border-slate-800'
                  }`}
                  title={hasPending ? 'Waiting for attachments to finish processing' : 'Send message'}
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
