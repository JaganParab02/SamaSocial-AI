/**
 * MobileSidebar — Responsive 280px slide-out mobile drawer with complete upload and source management.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain } from 'lucide-react';
import SourceList from '../upload/SourceList';
import UploadPanel from '../upload/UploadPanel';
import type { SourceResponse, UploadItem } from '../../types/api';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourceResponse[];
  isLoadingSources: boolean;
  onDeleteSource: (sourceId: string) => void;
  onRefreshSources: () => void;
  isDeletingSource: boolean;
  uploads: UploadItem[];
  isUploading: boolean;
  onUploadFile: (file: File) => Promise<unknown>;
  onUploadUrl: (url: string) => Promise<unknown>;
  onUploadYoutube: (url: string) => Promise<unknown>;
}

export default function MobileSidebar({
  isOpen,
  onClose,
  sources,
  isLoadingSources,
  onDeleteSource,
  onRefreshSources,
  isDeletingSource,
  uploads,
  isUploading,
  onUploadFile,
  onUploadUrl,
  onUploadYoutube,
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

          {/* 280px Drawer Container */}
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-[#0B1120] border-r border-slate-800/80 flex flex-col lg:hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-[#0E1526]/90">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-100">Knowledge Base</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <SourceList
                sources={sources}
                isLoading={isLoadingSources}
                onDelete={onDeleteSource}
                onRefresh={onRefreshSources}
                isDeleting={isDeletingSource}
                onOpenUpload={onClose}
              />
            </div>

            <UploadPanel
              onUploadFile={onUploadFile}
              onUploadUrl={onUploadUrl}
              onUploadYoutube={onUploadYoutube}
              uploads={uploads}
              isUploading={isUploading}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
