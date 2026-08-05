/**
 * Sidebar — 280px responsive AI SaaS sidebar with categorized navigation tabs, sources, and integrated upload panel.
 */
import { useState, useRef } from 'react';
import { PanelLeftClose, PanelLeft, Database, Clock, Layers } from 'lucide-react';
import SourceList from '../upload/SourceList';
import UploadPanel from '../upload/UploadPanel';
import type { SourceResponse, UploadItem } from '../../types/api';

interface SidebarProps {
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
  focusUploadTrigger?: number;
}

type SectionTab = 'sources' | 'recent' | 'collections';

export default function Sidebar({
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
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionTab>('sources');
  const uploadPanelRef = useRef<HTMLDivElement>(null);

  const scrollToUpload = () => {
    uploadPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems: { key: SectionTab; label: string; icon: typeof Database }[] = [
    { key: 'sources', label: 'Sources', icon: Database },
    { key: 'recent', label: 'Recent', icon: Clock },
    { key: 'collections', label: 'Collections', icon: Layers },
  ];

  // Sort by newest for "Recent"
  const displayedSources = activeSection === 'recent'
    ? [...sources].reverse()
    : sources;

  return (
    <>
      {/* Collapse toggle button (desktop) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute top-4 left-0 z-40 items-center justify-center w-6 h-8 bg-[#1F2937] border border-slate-700 rounded-r-lg text-slate-400 hover:text-indigo-400 transition-colors shadow-md cursor-pointer"
        style={{ left: isCollapsed ? 0 : 'calc(280px - 1px)' }}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <PanelLeft className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
      </button>

      {/* 280px Fixed Responsive Sidebar */}
      <aside
        className={`bg-[#0E1526]/95 backdrop-blur-md border-r border-slate-800/80 flex flex-col transition-all duration-300 shrink-0 select-none ${
          isCollapsed ? 'w-0 overflow-hidden opacity-0 lg:w-0' : 'w-[280px]'
        } hidden lg:flex shadow-xl z-20`}
      >
        {/* Section Nav Strip (Sources, Recent, Collections) */}
        <div className="px-2 pt-2 pb-1 border-b border-slate-800/60 flex items-center justify-between gap-1">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSection === key
                  ? 'bg-[#1F2937] text-indigo-400 border border-slate-700/80 shadow-inner'
                  : 'text-[#9CA3AF] hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Section Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeSection === 'collections' ? (
            <div className="p-4 text-center my-auto space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mx-auto flex items-center justify-center text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Smart Collections</h4>
              <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                Organize uploaded PDFs, lectures, and articles into topic workspaces for focused conversational queries.
              </p>
              <button
                onClick={() => setActiveSection('sources')}
                className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-medium transition-colors"
              >
                View active sources
              </button>
            </div>
          ) : (
            <SourceList
              sources={displayedSources}
              isLoading={isLoadingSources}
              onDelete={onDeleteSource}
              onRefresh={onRefreshSources}
              isDeleting={isDeletingSource}
              onOpenUpload={scrollToUpload}
            />
          )}
        </div>

        {/* Upload Dropzone Panel */}
        <div ref={uploadPanelRef}>
          <UploadPanel
            onUploadFile={onUploadFile}
            onUploadUrl={onUploadUrl}
            onUploadYoutube={onUploadYoutube}
            uploads={uploads}
            isUploading={isUploading}
          />
        </div>
      </aside>
    </>
  );
}
