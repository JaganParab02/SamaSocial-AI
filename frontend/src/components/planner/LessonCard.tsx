/**
 * LessonCard — Interactive card representing a single educational lesson within a curriculum module.
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
    <div className="bg-slate-900/60 hover:bg-slate-900/90 p-4 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-all flex flex-col gap-2 group shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-1 font-medium text-slate-200">
          <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <div className="flex-1 text-sm font-bold text-slate-100">
            <EditableField
              value={lesson.title}
              onChange={(val) => onUpdate({ ...lesson, title: String(val) })}
              placeholder="Lesson title..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-semibold">
            <Clock className="w-3 h-3" />
            <EditableField
              value={lesson.estimated_duration_minutes}
              onChange={(val) => onUpdate({ ...lesson, estimated_duration_minutes: Number(val) })}
              type="number"
              className="w-10 text-center text-amber-300 font-mono"
            />
            <span>min</span>
          </div>

          <button
            onClick={onDelete}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Remove Lesson"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pl-8 text-xs text-slate-400 leading-relaxed">
        <EditableField
          value={lesson.description}
          onChange={(val) => onUpdate({ ...lesson, description: String(val) })}
          type="textarea"
          placeholder="Detailed lesson description..."
        />
      </div>
    </div>
  );
}
