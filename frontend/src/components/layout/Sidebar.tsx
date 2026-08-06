/**
 * Sidebar — 296px responsive SaaS sidebar with categorized navigation tabs, sources, and pinned bottom upload panel.
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
        className="hidden lg:flex absolute top-3 left-0 z-40 items-center justify-center w-6 h-8 bg-[#21232A] border border-slate-700/80 rounded-r-xl text-slate-300 hover:text-white transition-colors shadow-md cursor-pointer"
        style={{ left: isCollapsed ? '64px' : '296px' }}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse to rail'}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <PanelLeft className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
      </button>

      {/* Responsive Sidebar: 296px default, collapses to 64px icon rail on desktop when collapsed */}
      <aside
        className={`bg-[#141519] border-r border-slate-800/70 flex flex-col transition-all duration-250 shrink-0 select-none ${
          isCollapsed ? 'w-[64px] overflow-hidden' : 'w-[296px]'
        } hidden lg:flex z-20 text-slate-200`}
      >
        {/* Section Nav Strip (Sources, Recent, Collections) */}
        {isCollapsed ? (
          <div className="py-3 flex flex-col items-center gap-2.5 border-b border-slate-800/60">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActiveSection(key); setIsCollapsed(false); }}
                title={label}
                aria-label={`View ${label}`}
                className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeSection === key ? 'bg-[#252831] text-indigo-400 border border-slate-700/60' : 'text-slate-400 hover:text-white hover:bg-[#1E2027]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        ) : (
          <div className="px-2.5 pt-2.5 pb-2 border-b border-slate-800/60 flex items-center justify-between gap-1">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeSection === key
                    ? 'bg-[#252832] text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-white hover:bg-[#1E2027]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Section Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeSection === 'collections' && !isCollapsed ? (
            <div className="p-6 text-center my-auto space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 mx-auto flex items-center justify-center text-indigo-400 shadow-inner">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-heading font-semibold text-white">Smart Collections</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organize uploaded documents and videos into structured topic collections.
              </p>
              <button
                onClick={() => setActiveSection('sources')}
                className="mt-2 px-3.5 py-1.5 bg-[#262932] hover:bg-[#31343F] text-slate-200 rounded-xl border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                View active sources
              </button>
            </div>
          ) : !isCollapsed ? (
            <SourceList
              sources={displayedSources}
              isLoading={isLoadingSources}
              onDelete={onDeleteSource}
              onRefresh={onRefreshSources}
              isDeleting={isDeletingSource}
              onOpenUpload={scrollToUpload}
            />
          ) : (
            <div className="py-4 flex flex-col items-center text-center my-auto">
              <span className="text-[11px] font-mono text-slate-500 -rotate-90 whitespace-nowrap tracking-widest">
                {sources.length} SOURCES
              </span>
            </div>
          )}
        </div>

        {/* Pinned Bottom Upload Panel with upwards padding to lift UI */}
        {!isCollapsed && (
          <div ref={uploadPanelRef} className="border-t border-slate-800/80 shrink-0 bg-[#111317] p-2 sm:p-2.5 pb-6 sm:pb-8">
            <UploadPanel
              onUploadFile={onUploadFile}
              onUploadUrl={onUploadUrl}
              onUploadYoutube={onUploadYoutube}
              uploads={uploads}
              isUploading={isUploading}
            />
          </div>
        )}
      </aside>
    </>
  );
}
