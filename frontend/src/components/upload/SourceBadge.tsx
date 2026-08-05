/**
 * SourceBadge — visual badge showing source type with appropriate icon and color.
 */
import { FileText, Presentation, Globe, Video } from 'lucide-react';
import type { SourceType } from '../../types/api';

interface SourceBadgeProps {
  type: SourceType;
  className?: string;
}

const sourceConfig: Record<SourceType, { icon: typeof FileText; color: string; bg: string; label: string }> = {
  pdf: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'PDF' },
  ppt: { icon: Presentation, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'PPT' },
  pptx: { icon: Presentation, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'PPTX' },
  web: { icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Web' },
  youtube: { icon: Video, color: 'text-red-400', bg: 'bg-red-500/10', label: 'YouTube' },
};

export default function SourceBadge({ type, className = '' }: SourceBadgeProps) {
  const config = sourceConfig[type] || sourceConfig.pdf;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${config.bg} ${config.color} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
