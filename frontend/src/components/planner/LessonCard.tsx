/**
 * LessonCard — Interactive row representing a single lesson with mono index badge and clock duration pill.
 */
import { Clock, Trash2, ChevronRight } from 'lucide-react';
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
    <div className="bg-slate-900/40 hover:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-transparent hover:border-white/5 transition-all flex flex-col gap-3 group shadow-sm cursor-pointer relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 text-slate-300 font-mono text-[13px] font-bold flex items-center justify-center shrink-0 shadow-inner group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
            {String(index + 1).padStart(2, '0')}
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="text-[15px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">
              <EditableField
                value={lesson.title}
                onChange={(val) => onUpdate({ ...lesson, title: String(val) })}
                placeholder="Lesson title…"
              />
            </div>
            <div className="text-[13px] text-slate-500 font-medium truncate mt-0.5 max-w-full sm:max-w-[85%]">
              <EditableField
                value={lesson.description}
                onChange={(val) => onUpdate({ ...lesson, description: String(val) })}
                placeholder="Detailed lesson description and exercises…"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5 text-[13px] text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/5 font-mono font-medium shadow-inner hidden sm:flex">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <EditableField
              value={lesson.estimated_duration_minutes}
              onChange={(val) => onUpdate({ ...lesson, estimated_duration_minutes: Number(val) })}
              type="number"
              className="w-8 text-center text-slate-200 font-bold"
            />
            <span className="text-slate-500">min</span>
          </div>

          <div className="flex items-center gap-2 sm:border-l border-white/5 sm:pl-3">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              aria-label="Remove lesson"
              className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              title="Remove Lesson"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
