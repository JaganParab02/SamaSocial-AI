/**
 * UploadPanel — Beautiful dropzone supporting files, web URLs, and YouTube inputs with hover animations.
 */
import { useState, useCallback, useRef } from 'react';
import { Link, Video, X, FileUp, CheckCircle, AlertCircle, Loader2, CloudUpload } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="border-t border-slate-800/80 bg-[#0E1526]/90 p-3 shrink-0 shadow-lg">
      {/* Tab Selector */}
      <div className="flex bg-[#1F2937] p-1 rounded-xl mb-3 border border-slate-700/60">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {/* File Dropzone */}
        {activeTab === 'file' && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[135px] ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-500/15 scale-102 shadow-lg shadow-indigo-500/20'
                : 'border-slate-700/80 hover:border-indigo-500/80 bg-[#111827]/80 hover:bg-indigo-500/5'
            }`}
          >
            <motion.div
              animate={isDragOver ? { scale: [1, 1.15, 1], y: -3 } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-10 h-10 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center mb-2 transition-colors"
            >
              <CloudUpload className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            </motion.div>
            <p className="text-xs font-bold text-slate-200 tracking-wide">
              Drag & Drop Files <span className="font-normal text-slate-400">or</span> <span className="text-indigo-400 underline">Browse Files</span>
            </p>

            {/* Supported Formats Pill Tags */}
            <div className="flex flex-wrap justify-center gap-1 mt-2.5">
              {formatTags.map((t) => (
                <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
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
          </motion.div>
        )}

        {/* URL Upload */}
        {activeTab === 'url' && (
          <div className="space-y-2 p-1">
            <p className="text-[11px] text-[#9CA3AF]">Index articles, tutorials, or online documentation directly into vector storage.</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="https://example.com/article..."
                className="flex-1 px-3 py-2 text-xs bg-[#111827] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                disabled={isUploading}
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleUrlSubmit}
                disabled={isUploading || !urlInput.trim()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl transition-colors shadow-md shadow-indigo-600/20"
              >
                Index
              </motion.button>
            </div>
          </div>
        )}

        {/* YouTube Upload */}
        {activeTab === 'youtube' && (
          <div className="space-y-2 p-1">
            <p className="text-[11px] text-[#9CA3AF]">Extract captions & transcripts instantly from any YouTube video link.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleYoutubeSubmit()}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 px-3 py-2 text-xs bg-[#111827] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                disabled={isUploading}
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleYoutubeSubmit}
                disabled={isUploading || !youtubeInput.trim()}
                className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-red-600/25"
              >
                Extract
              </motion.button>
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
              className="flex items-center gap-2 p-2.5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs flex-1 font-medium">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Progress List */}
        {uploads.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
            {uploads.slice(-3).map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-2 py-1 bg-slate-900/60 rounded-lg text-xs border border-slate-800">
                {item.status === 'uploading' || item.status === 'processing' ? (
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                ) : item.status === 'success' ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : item.status === 'error' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                ) : null}
                <span className="text-slate-300 truncate font-medium flex-1 text-[11px]">
                  {item.file?.name || item.url || 'Processing asset...'}
                </span>
                {(item.status === 'uploading' || item.status === 'processing') && (
                  <span className="text-indigo-400 font-mono text-[10px] font-semibold">{item.progress}%</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
