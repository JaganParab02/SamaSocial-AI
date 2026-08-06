/**
 * CitationCard — Sleek document reference card styled after Claude AI interface artifact chips.
 * Resilient against null/undefined source names or types.
 */
import { FileText, Presentation, Globe, Video } from 'lucide-react';
import type { Citation, SourceType } from '../../types/api';
import toast from 'react-hot-toast';

interface CitationCardProps {
  citation: Citation;
  index: number;
}

const typeConfig: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  pdf: { icon: FileText, color: 'text-indigo-400', label: 'PDF Reference' },
  ppt: { icon: Presentation, color: 'text-amber-400', label: 'Slide Deck' },
  pptx: { icon: Presentation, color: 'text-amber-400', label: 'Slide Deck' },
  web: { icon: Globe, color: 'text-emerald-400', label: 'Web Source' },
  url: { icon: Globe, color: 'text-emerald-400', label: 'Web Source' },
  youtube: { icon: Video, color: 'text-rose-400', label: 'Video Transcript' },
};

export default function CitationCard({ citation, index }: CitationCardProps) {
  const sourceType = (citation.source_type || citation.type || 'pdf') as SourceType;
  const sourceName = citation.source_name || citation.name || 'Grounded Document';
  
  const config = typeConfig[sourceType] || typeConfig.pdf;
  const Icon = config.icon;

  const getLocationText = () => {
    if (citation.page_number) return `Pg. ${citation.page_number}`;
    if (citation.slide_number) return `Slide ${citation.slide_number}`;
    if (citation.timestamp) return `@ ${citation.timestamp}`;
    return config.label;
  };

  const location = getLocationText();

  return (
    <div
      onClick={() => toast(`Referencing context from: ${sourceName}`, { icon: '📄' })}
      className="group flex items-center justify-between p-2.5 rounded-xl bg-[#23252B] hover:bg-[#2A2C34] border border-slate-700/60 shadow-sm transition-all cursor-pointer w-full"
    >
      <div className="flex items-center gap-2.5 truncate min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#2B2E37] border border-slate-700/80 flex items-center justify-center shrink-0 shadow-inner">
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="truncate flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
            {sourceName}
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
            <span>Ref [{index + 1}]</span>
            <span>•</span>
            <span className="truncate">{location}</span>
          </div>
        </div>
      </div>
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2C2F38] group-hover:bg-[#363A45] text-[11px] font-semibold text-slate-300 border border-slate-700/60 shrink-0 ml-2 transition-colors">
        <span>View</span>
      </span>
    </div>
  );
}
