/**
 * SourceCard — Premium SaaS source card item displaying file info, status badges, and preview/delete controls.
 * Safely resolves properties regardless of Pydantic model vs frontend interface naming conventions.
 */
import { useState } from 'react';
import { FileText, Globe, Video, Trash2, Eye, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SourceResponse } from '../../types/api';

interface SourceCardProps {
  source: SourceResponse;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export default function SourceCard({ source, onDelete, isDeleting }: SourceCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  // Safely resolve properties whether backend returned 'name' or 'source_name', 'type' or 'source_type'
  const sourceName = source?.source_name || source?.name || 'Untitled Document';
  const sourceType = (source?.source_type || source?.type || 'pdf') as string;
  const sourceId = source?.source_id || 'unknown_source';
  const sourceStatus = source?.status || 'ready';
  const chunksCount = source?.chunks_count ?? source?.metadata?.chunks_count ?? 0;

  const getSourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-purple-400" />;
      case 'ppt':
      case 'pptx':
      case 'docx':
      case 'txt':
        return <FileSpreadsheet className="w-4 h-4 text-amber-400" />;
      case 'youtube':
        return <Video className="w-4 h-4 text-red-500" />;
      case 'web':
      case 'url':
        return <Globe className="w-4 h-4 text-blue-400" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'youtube':
        return 'bg-red-500/15 text-red-300 border-red-500/30';
      case 'web':
      case 'url':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      default:
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    }
  };

  const estimatedPages = chunksCount > 0 ? Math.max(1, Math.ceil(chunksCount / 3)) : 1;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -2, scale: 1.01 }}
        className="group relative p-3 rounded-xl bg-[#1F2937]/90 hover:bg-[#1F2937] border border-slate-700/60 hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-md cursor-pointer mb-2"
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 shrink-0">
            {getSourceIcon(sourceType)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${getBadgeColor(sourceType)}`}>
                {sourceType}
              </span>
              {sourceStatus === 'processing' ? (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Indexing...
                </span>
              ) : (sourceStatus === 'ready' || sourceStatus === 'completed') ? (
                <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[10px] text-red-400 font-medium">
                  <AlertCircle className="w-2.5 h-2.5" /> {sourceStatus}
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-slate-100 truncate mt-1" title={sourceName}>
              {sourceName}
            </p>

            <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] mt-1.5">
              <span>
                {sourceType === 'youtube' || sourceType === 'web' || sourceType === 'url' ? `${chunksCount} vector chunks` : `${estimatedPages} pages (${chunksCount} chunks)`}
              </span>
              <span>Active now</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 mt-2 pt-2 border-t border-slate-800/60 text-xs">
          <button
            onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-indigo-300 hover:bg-slate-800/80 rounded transition-colors"
          >
            <Eye className="w-3 h-3" /> Preview
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(sourceId); }}
            disabled={isDeleting}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111827] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200"
            >
              <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  {getSourceIcon(sourceType)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-sm font-bold text-slate-100 truncate">{sourceName}</h3>
                  <p className="text-xs text-[#9CA3AF] mt-0.5 uppercase tracking-wide">Type: {sourceType}</p>
                </div>
              </div>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">Source ID:</span>
                  <span className="font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded text-indigo-300">{sourceId.substring(0, 18)}...</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">Indexed Chunks in Qdrant:</span>
                  <span className="font-semibold text-emerald-400">{chunksCount} Chunks</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">Status:</span>
                  <span className="capitalize font-medium text-slate-200">{sourceStatus}</span>
                </div>
                <p className="text-slate-400 pt-2 leading-relaxed">
                  This resource has been vectorized and stored in Qdrant. Whenever you ask questions in the chat, SamaSocial AI automatically scans these embeddings for grounding and precision citations.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
