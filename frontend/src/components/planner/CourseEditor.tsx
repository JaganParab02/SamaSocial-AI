/**
 * CourseEditor — JSON editor for manual edits to the Course Plan.
 */
import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import type { CoursePlan } from '../../types/api';
import toast from 'react-hot-toast';

interface CourseEditorProps {
  plan: CoursePlan;
  onSave: (newPlan: CoursePlan) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function CourseEditor({ plan, onSave, onCancel, isSaving }: CourseEditorProps) {
  const [jsonStr, setJsonStr] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJsonStr(JSON.stringify(plan, null, 2));
  }, [plan]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonStr) as CoursePlan;
      setError(null);
      onSave(parsed);
      toast.success('Course Plan updated manually!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid JSON structure');
      toast.error('Invalid JSON structure');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900">
      <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
          Manual JSON Editor
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs font-mono">
          Parse Error: {error}
        </div>
      )}

      <div className="flex-1 p-4 overflow-hidden">
        <textarea
          value={jsonStr}
          onChange={(e) => setJsonStr(e.target.value)}
          className="w-full h-full p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
