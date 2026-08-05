/**
 * SourceList — Organized sidebar source view with search filtering, categories, and AI empty state.
 * Resilient against both backend and frontend field naming schemas (name vs source_name).
 */
import { useState } from 'react';
import { RefreshCw, Search, FolderOpen, Sparkles } from 'lucide-react';
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search & Header Strip */}
      <div className="px-3.5 pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" /> Knowledge Base
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[11px] font-mono text-indigo-300">
              {sources?.length || 0}
            </span>
          </span>
          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Refresh Qdrant index"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>

        {/* Search Input Filter */}
        {sources && sources.length > 0 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sources..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#111827] border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
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
                className={`px-2 py-0.5 rounded-md capitalize font-medium transition-colors ${
                  filterType === t ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'bg-slate-800/70 text-slate-400 hover:text-slate-300'
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
        {(!sources || sources.length === 0) && !isLoading ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center p-5 my-2 rounded-2xl bg-[#111827]/60 border border-slate-800/80 shadow-inner"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl mb-3 shadow-lg shadow-indigo-500/10">
              📄
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">No sources yet</h4>
            <p className="text-xs text-[#9CA3AF] mb-4 leading-relaxed max-w-[200px]">
              Upload PDFs, PowerPoints, YouTube videos or webpages.
            </p>
            {onOpenUpload && (
              <motion.button
                onClick={onOpenUpload}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="w-full py-2 px-3 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-md shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" /> + Upload Sources
              </motion.button>
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

        {sources && sources.length > 0 && filteredSources.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-6">No sources matching "{searchQuery}"</p>
        )}
      </div>
    </div>
  );
}
