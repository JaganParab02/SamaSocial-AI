/**
 * UploadPanel — Pinned bottom dropzone supporting files, web URLs, and YouTube inputs.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, Video, X, FileUp, CheckCircle, AlertCircle, Loader2, CloudUpload, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UploadItem } from '../../types/api';

interface UploadPanelProps {
  onUploadFile: (file: File) => Promise<unknown>;
  onUploadUrl: (url: string) => Promise<unknown>;
  onUploadYoutube: (url: string) => Promise<unknown>;
  uploads: UploadItem[];
  isUploading: boolean;
  isOpenExplicitly?: boolean;
}

const ACCEPTED_TYPES = ['.pdf', '.ppt', '.pptx', '.docx', '.txt'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
type TabKey = 'file' | 'url' | 'youtube';

export default function UploadPanel({ onUploadFile, onUploadUrl, onUploadYoutube, uploads, isUploading }: UploadPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('file');
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewingSummary, setViewingSummary] = useState<{ title: string; type: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const latest = uploads[uploads.length - 1];
    if (latest && latest.status === 'success' && latest.result?.summary && !latest.hasShownSummary) {
      latest.hasShownSummary = true;
      setViewingSummary({
        title: latest.result.source_name || latest.file?.name || latest.url || 'Resource Summary',
        type: latest.result.source_type || latest.type || 'Document',
        content: latest.result.summary
      });
    }
  }, [uploads]);

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) return `Unsupported format. Accepted: ${ACCEPTED_TYPES.join(', ')}`;
    if (file.size > MAX_FILE_SIZE) return `File too large. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    return null;
  };

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);
      const file = files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      try {
        await onUploadFile(file);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    },
    [onUploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setError(null);
    try {
      new URL(urlInput.trim());
    } catch {
      setError('Please enter a valid HTTP/HTTPS URL');
      return;
    }
    try {
      await onUploadUrl(urlInput.trim());
      setUrlInput('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'URL extraction failed');
    }
  };

  const handleYoutubeSubmit = async () => {
    if (!youtubeInput.trim()) return;
    setError(null);
    try {
      await onUploadYoutube(youtubeInput.trim());
      setYoutubeInput('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'YouTube transcript parsing failed');
    }
  };

  const tabs: { key: TabKey; label: string; icon: typeof FileUp }[] = [
    { key: 'file', label: 'Dropzone', icon: FileUp },
    { key: 'url', label: 'Web URL', icon: Link },
    { key: 'youtube', label: 'YouTube', icon: Video },
  ];

  const formatTags = ['PDF', 'PPT', 'DOCX', 'TXT', 'URL', 'YouTube'];

  return (
    <div className="bg-[#181A22] border border-slate-700/80 rounded-[28px] p-5 sm:p-7 shadow-2xl shrink-0 select-none m-2 sm:m-3 mb-6 transition-all">
      {/* Segmented Tab Selector with generous spacing and font size */}
      <div className="flex bg-[#21242E] p-2 rounded-2xl mb-5 border border-slate-700/60 shadow-inner">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === key
                ? 'bg-[#2B2E3C] text-white shadow-lg border border-slate-600/70 scale-[1.03]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* File Dropzone */}
        {activeTab === 'file' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative border-2 border-dashed rounded-2xl p-7 my-3 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[160px] shadow-sm ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-700 hover:border-indigo-400 bg-[#1D1F29] hover:bg-[#252834]'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#292C3A] border border-slate-600 flex items-center justify-center mb-3.5 text-indigo-400 shadow-md group-hover:scale-110 transition-transform">
              <CloudUpload className="w-6 h-6" />
            </div>
            <p className="text-sm font-extrabold text-slate-100 tracking-wide mb-1">
              Drag files or <span className="text-indigo-400 underline decoration-indigo-500/50">Browse</span>
            </p>

            {/* Supported Formats Chips */}
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {formatTags.map((t) => (
                <span key={t} className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-[#262833] text-slate-300 border border-slate-700/80 shadow-xs">
                  {t}
                </span>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.ppt,.pptx,.docx,.txt"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        )}

        {/* URL Upload with enlarged input box and padded button */}
        {activeTab === 'url' && (
          <div className="space-y-3 p-1">
            <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
              Index web documentation directly into vector storage.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="https://example.com/doc..."
                className="flex-1 px-4 py-3 text-sm bg-[#1A1C25] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                disabled={isUploading}
              />
              <button
                onClick={handleUrlSubmit}
                disabled={isUploading || !urlInput.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/60 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer shrink-0"
              >
                Index
              </button>
            </div>
          </div>
        )}

        {/* YouTube Upload with enlarged input box and padded button */}
        {activeTab === 'youtube' && (
          <div className="space-y-3 p-1">
            <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
              Extract transcripts instantly from any YouTube video.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleYoutubeSubmit()}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 px-4 py-3 text-sm bg-[#1A1C25] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                disabled={isUploading}
              />
              <button
                onClick={handleYoutubeSubmit}
                disabled={isUploading || !youtubeInput.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/60 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer shrink-0"
              >
                Extract
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className="flex items-center gap-2 p-2.5 bg-[var(--error-bg)] border border-[var(--error)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
            >
              <AlertCircle className="w-4 h-4 text-[var(--error)] shrink-0" />
              <p className="text-xs flex-1 font-medium text-[var(--error)]">{error}</p>
              <button onClick={() => setError(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Progress List */}
        {uploads.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
            {uploads.slice(-3).map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-canvas)] rounded-[var(--radius-sm)] text-xs border border-[var(--border-subtle)]">
                {item.status === 'uploading' || item.status === 'processing' ? (
                  <Loader2 className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-spin shrink-0" />
                ) : item.status === 'success' ? (
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />
                ) : item.status === 'error' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-[var(--error)] shrink-0" />
                ) : null}
                <span className="text-[var(--text-primary)] truncate font-medium flex-1 text-xs">
                  {item.file?.name || item.url || 'Processing asset…'}
                </span>
                {item.status === 'success' && item.result?.summary && (
                  <button
                    onClick={() => setViewingSummary({
                      title: item.result?.source_name || item.file?.name || item.url || 'Resource Summary',
                      type: item.result?.source_type || item.type || 'Document',
                      content: item.result?.summary || 'No summary available.'
                    })}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-[11px] border border-[var(--border-strong)] transition-all cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-[var(--accent-primary)]" /> Summary
                  </button>
                )}
                {(item.status === 'uploading' || item.status === 'processing') && (
                  <span className="text-[var(--accent-primary)] font-mono text-[10px] font-semibold">{item.progress}%</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* AI Quick Summary Modal */}
        <AnimatePresence>
          {viewingSummary && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" onClick={() => setViewingSummary(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 8 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] max-w-lg w-full p-6 shadow-2xl text-[var(--text-primary)] overflow-hidden relative max-h-[80vh] flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 mb-4 shrink-0">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--accent-primary)] shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-heading font-bold text-[var(--text-primary)] truncate">{viewingSummary.title}</h3>
                      <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--bg-canvas)] px-1.5 py-0.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)]">
                        {viewingSummary.type} · AI Summary
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setViewingSummary(null)} aria-label="Close modal" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="overflow-y-auto pr-1 space-y-3 text-xs leading-relaxed text-[var(--text-secondary)] font-normal select-text">
                  <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] shadow-inner whitespace-pre-wrap text-[var(--text-primary)]">
                    {viewingSummary.content}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] shrink-0 text-xs text-[var(--text-tertiary)]">
                  <span>✨ Summary generated upon indexing</span>
                  <button
                    onClick={() => setViewingSummary(null)}
                    className="px-4 py-1.5 font-semibold text-xs bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] rounded-[var(--radius-md)] shadow-sm transition-all cursor-pointer"
                  >
                    Got it
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
