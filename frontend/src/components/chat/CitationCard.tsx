/**
 * CitationCard — beautiful inline citation display with type-specific icons and colors.
 * Resilient against null/undefined source names or types.
 */
import { FileText, Presentation, Globe, Video } from 'lucide-react';
import type { Citation, SourceType } from '../../types/api';

interface CitationCardProps {
  citation: Citation;
  index: number;
}

const typeConfig: Record<string, { icon: typeof FileText; color: string; bg: string; border: string; emoji: string }> = {
  pdf: { icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', emoji: '📄' },
  ppt: { icon: Presentation, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', emoji: '📊' },
  pptx: { icon: Presentation, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', emoji: '📊' },
  web: { icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', emoji: '🌐' },
  url: { icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', emoji: '🌐' },
  youtube: { icon: Video, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', emoji: '🎥' },
};

export default function CitationCard({ citation }: CitationCardProps) {
  const sourceType = (citation.source_type || citation.type || 'pdf') as SourceType;
  const sourceName = citation.source_name || citation.name || 'Source Reference';
  
  const config = typeConfig[sourceType] || typeConfig.pdf;
  const Icon = config.icon;

  const getLocationText = () => {
    if (citation.page_number) return `Page ${citation.page_number}`;
    if (citation.slide_number) return `Slide ${citation.slide_number}`;
    if (citation.timestamp) return citation.timestamp;
    return '';
  };

  const location = getLocationText();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all hover:scale-[1.02] cursor-default ${config.bg} ${config.border} ${config.color}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span className="truncate max-w-[150px] font-semibold">{sourceName}</span>
      {location && (
        <>
          <span className="text-slate-500">·</span>
          <span className="opacity-80 font-mono text-[11px]">{location}</span>
        </>
      )}
    </div>
  );
}
