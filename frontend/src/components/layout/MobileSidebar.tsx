/**
 * MobileSidebar — Responsive slide-out mobile drawer with source management.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import SourceList from '../upload/SourceList';
import type { SourceResponse, UploadItem } from '../../types/api';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourceResponse[];
  isLoadingSources: boolean;
  onDeleteSource: (sourceId: string) => void;
  onRefreshSources: () => void;
  isDeletingSource: boolean;
  uploads?: UploadItem[];
  isUploading?: boolean;
  onUploadFile?: (file: File) => Promise<unknown>;
  onUploadUrl?: (url: string) => Promise<unknown>;
  onUploadYoutube?: (url: string) => Promise<unknown>;
}

export default function MobileSidebar({
  isOpen,
  onClose,
  sources,
  isLoadingSources,
  onDeleteSource,
  onRefreshSources,
  isDeletingSource,
}: MobileSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden"
          />

          {/* 296px Drawer Container */}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[296px] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col h-full lg:hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[var(--radius-sm)] brand-gradient-bg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-heading font-bold text-[var(--text-primary)]">Knowledge Base</span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close sidebar drawer"
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] rounded-[var(--radius-sm)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
              <SourceList
                sources={sources}
                isLoading={isLoadingSources}
                onDelete={onDeleteSource}
                onRefresh={onRefreshSources}
                isDeleting={isDeletingSource}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
