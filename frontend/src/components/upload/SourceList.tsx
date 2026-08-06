/**
 * SourceList — Sidebar source view with conditional search filtering and refined empty state.
 */
import { useState } from 'react';
import { RefreshCw, Search, FolderOpen, Sparkles, Database } from 'lucide-react';
import SourceCard from './SourceCard';
import type { SourceResponse } from '../../types/api';
import { motion } from 'framer-motion';

interface SourceListProps {
  sources: SourceResponse[];
  isLoading: boolean;
  onDelete: (sourceId: string) => void;
  onRefresh: () => void;
  isDeleting: boolean;
  onOpenUpload?: () => void;
}

export default function SourceList({ sources, isLoading, onDelete, onRefresh, isDeleting, onOpenUpload }: SourceListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredSources = (sources || []).filter((src) => {
    if (!src) return false;
    const sourceName = src.source_name || src.name || 'Untitled Document';
    const sourceType = src.source_type || src.type || 'pdf';
    
    const matchesSearch = sourceName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || sourceType === filterType;
    return matchesSearch && matchesType;
  });

  const hasSources = sources && sources.length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Header Strip */}
      <div className="px-3.5 pt-3 pb-2 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-heading font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>KNOWLEDGE BASE</span>
            <span className="px-1.5 py-0.5 rounded-[var(--radius-pill)] bg-[var(--bg-elevated)] text-[11px] font-mono font-bold text-[var(--accent-primary)] border border-[var(--border-subtle)]">
              {sources?.length || 0}
            </span>
          </span>
          <button
            onClick={onRefresh}
            aria-label="Refresh sources index"
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] transition-colors cursor-pointer"
            title="Refresh Qdrant index"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[var(--accent-primary)]' : ''}`} />
          </button>
        </div>

        {/* Conditional Search Input: only visible when at least 1 source exists */}
        {hasSources && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sources…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
          </div>
        )}

        {/* Quick Type Filter Tags */}
        {sources && sources.length > 1 && (
          <div className="flex items-center gap-1 text-[11px] overflow-x-auto no-scrollbar py-0.5">
            {['all', 'pdf', 'youtube', 'url'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2 py-0.5 rounded-[var(--radius-sm)] capitalize font-medium transition-colors cursor-pointer ${
                  filterType === t
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold border border-[var(--border-strong)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Source Cards Container */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {!hasSources && !isLoading ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center p-6 my-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-inner"
          >
            <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--accent-primary-muted)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--accent-primary)] mb-3">
              <Database className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-heading font-bold text-[var(--text-primary)] mb-1">No sources yet</h4>
            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed max-w-[210px]">
              Upload PDFs, presentations, YouTube videos, or webpages below.
            </p>
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                aria-label="Add new sources"
                className="w-full py-2 px-3 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-strong)] rounded-[var(--radius-md)] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Add Knowledge Source</span>
              </button>
            )}
          </motion.div>
        ) : (
          filteredSources.map((source, index) => (
            <SourceCard
              key={source.source_id || `src-${index}`}
              source={source}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          ))
        )}

        {hasSources && filteredSources.length === 0 && (
          <p className="text-xs text-[var(--text-tertiary)] text-center py-6">No sources matching "{searchQuery}"</p>
        )}
      </div>
    </div>
  );
}
