/**
 * SourceCard — Source item displaying file info, status badges, and preview/delete controls.
 * Safely resolves properties regardless of Pydantic model vs frontend interface naming conventions.
 */
import { useState } from 'react';
import { FileText, Globe, Video, Trash2, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SourceResponse } from '../../types/api';

interface SourceCardProps {
  source: SourceResponse;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export default function SourceCard({ source, onDelete, isDeleting }: SourceCardProps) {
  const [showPreview, setShowPreview] = useState(false);

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
        return <Video className="w-4 h-4 text-red-400" />;
      case 'web':
      case 'url':
        return <Globe className="w-4 h-4 text-blue-400" />;
      default:
        return <FileText className="w-4 h-4 text-[var(--accent-primary)]" />;
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
        return 'bg-[var(--accent-primary-muted)] text-[var(--accent-primary)] border-[var(--border-strong)]';
    }
  };

  const estimatedPages = chunksCount > 0 ? Math.max(1, Math.ceil(chunksCount / 3)) : 1;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="group relative p-3 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all shadow-sm mb-2.5 cursor-pointer"
        onClick={() => setShowPreview(true)}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] shrink-0">
            {getSourceIcon(sourceType)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[var(--radius-sm)] uppercase tracking-wider border ${getBadgeColor(sourceType)}`}>
                {sourceType}
              </span>
              {sourceStatus === 'processing' ? (
                <span className="flex items-center gap-1 text-[10px] text-[var(--warning)] font-medium">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Indexing…
                </span>
              ) : (sourceStatus === 'ready' || sourceStatus === 'completed') ? (
                <span className="flex items-center gap-1 text-[10px] text-[var(--success)] font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-[var(--error)] font-medium">
                  <AlertCircle className="w-2.5 h-2.5" /> Failed
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-[var(--text-primary)] truncate mt-1.5" title={sourceName}>
              {sourceName}
            </p>

            <div className="flex items-center justify-between font-mono text-[11px] text-[var(--text-secondary)] mt-1">
              <span>
                {sourceType === 'youtube' || sourceType === 'web' || sourceType === 'url' ? `${chunksCount} vector chunks` : `${estimatedPages} pages · ${chunksCount} chunks`}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)]">Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 mt-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
          <button
            onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
            aria-label="View AI summary"
            title="Inspect vector summary and details"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] bg-[var(--bg-canvas)] hover:bg-[var(--accent-primary-muted)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-[var(--radius-sm)] transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" /> Summary
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(sourceId); }}
            disabled={isDeleting}
            aria-label="Delete source from knowledge base"
            title="Remove vector embeddings from Qdrant index"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[var(--text-tertiary)] hover:text-[var(--error)] bg-[var(--bg-canvas)] hover:bg-[var(--error-bg)] border border-[var(--border-subtle)] hover:border-[var(--error)] rounded-[var(--radius-sm)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] max-w-md w-full p-6 shadow-2xl text-[var(--text-primary)]"
            >
              <div className="flex items-center gap-3 mb-4 border-b border-[var(--border-subtle)] pb-4">
                <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  {getSourceIcon(sourceType)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-sm font-heading font-bold text-[var(--text-primary)] truncate">{sourceName}</h3>
                  <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5 uppercase tracking-wide">Type: {sourceType}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[var(--text-secondary)]">
                <div className="flex justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span>Source ID:</span>
                  <span className="font-mono text-[11px] bg-[var(--bg-canvas)] px-2 py-0.5 rounded-[var(--radius-sm)] text-[var(--accent-primary)]">{sourceId.substring(0, 18)}…</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span>Indexed Chunks in Qdrant:</span>
                  <span className="font-semibold font-mono text-[var(--success)]">{chunksCount} Chunks</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span>Status:</span>
                  <span className="capitalize font-medium text-[var(--text-primary)]">{sourceStatus}</span>
                </div>
                <div className="pt-2">
                  <span className="text-xs font-bold text-[var(--accent-primary)] flex items-center gap-1 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> AI Quick Summary:
                  </span>
                  <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner font-normal text-xs">
                    {(source.summary || (source.metadata && source.metadata.summary as string)) || 'This resource was vectorized and indexed into Qdrant for semantic RAG search and citations.'}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-xs font-semibold bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] rounded-[var(--radius-md)] transition-colors cursor-pointer shadow-sm"
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
