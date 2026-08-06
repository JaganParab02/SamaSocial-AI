/**
 * LessonCard — Interactive card representing a single lesson with mono index badge and clock duration pill.
 */
import { Clock, Trash2 } from 'lucide-react';
import type { Lesson } from '../../types/api';
import EditableField from './EditableField';

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  onUpdate: (updated: Lesson) => void;
  onDelete: () => void;
}

export default function LessonCard({ lesson, index, onUpdate, onDelete }: LessonCardProps) {
  return (
    <div className="bg-[var(--bg-input)] hover:bg-[var(--bg-elevated)] p-3.5 sm:p-4 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all flex flex-col gap-2 group shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0 font-medium text-[var(--text-primary)]">
          <span className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-strong)] text-[var(--text-secondary)] font-mono text-xs font-bold flex items-center justify-center shrink-0">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="flex-1 text-sm font-heading font-bold text-[var(--text-primary)] min-w-0 truncate">
            <EditableField
              value={lesson.title}
              onChange={(val) => onUpdate({ ...lesson, title: String(val) })}
              placeholder="Lesson title…"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] bg-[var(--bg-canvas)] px-2.5 py-0.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] font-mono font-medium">
            <Clock className="w-3 h-3 text-[var(--accent-primary)]" />
            <EditableField
              value={lesson.estimated_duration_minutes}
              onChange={(val) => onUpdate({ ...lesson, estimated_duration_minutes: Number(val) })}
              type="number"
              className="w-8 text-center font-mono text-[var(--text-primary)] font-bold"
            />
            <span>min</span>
          </div>

          <button
            onClick={onDelete}
            aria-label="Remove lesson"
            className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] rounded-[var(--radius-sm)] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
            title="Remove Lesson"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pl-8 text-xs text-[var(--text-secondary)] leading-relaxed font-reading">
        <EditableField
          value={lesson.description}
          onChange={(val) => onUpdate({ ...lesson, description: String(val) })}
          type="textarea"
          placeholder="Detailed lesson description and exercises…"
        />
      </div>
    </div>
  );
}
