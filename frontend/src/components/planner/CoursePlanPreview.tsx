/**
 * CoursePlanPreview — renders the hierarchical Course Plan as a beautiful tree.
 * Allows switching to CourseEditor for inline JSON editing.
 */
import { BookOpen, Clock, Target, Layers, PlayCircle, Settings, Download } from 'lucide-react';
import type { CoursePlan, Module } from '../../types/api';
import { plannerService } from '../../services/plannerService';
import toast from 'react-hot-toast';

interface CoursePlanPreviewProps {
  plan: CoursePlan;
  sessionId: string;
  onEditToggle: () => void;
}

export default function CoursePlanPreview({ plan, sessionId, onEditToggle }: CoursePlanPreviewProps) {
  if (!plan.title && plan.modules.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <Layers className="w-12 h-12 mb-4 opacity-20" />
        <p>No course plan generated yet.</p>
        <p className="text-xs mt-2">Chat with the assistant to begin building your syllabus.</p>
      </div>
    );
  }

  const handleExport = async () => {
    try {
      const jsonStr = await plannerService.exportCoursePlan(sessionId);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `course_plan_${sessionId.substring(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Course Plan exported successfully!');
    } catch (err) {
      toast.error('Failed to export Course Plan');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-200">
      <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Live Course Preview
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={onEditToggle}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Settings className="w-3.5 h-3.5" /> Edit JSON
          </button>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Header section */}
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">{plan.title}</h1>
          <p className="text-slate-400 leading-relaxed mb-4">{plan.description}</p>
          <div className="flex flex-wrap gap-4 text-xs font-medium">
            <span className="px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700">Subject: {plan.subject}</span>
            <span className="px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700">Audience: {plan.target_audience}</span>
          </div>
        </div>

        {/* Outcomes & Prerequisites */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" /> Learning Outcomes
            </h3>
            <ul className="space-y-2">
              {plan.learning_outcomes?.map((outcome, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span> {outcome}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4" /> Prerequisites
            </h3>
            <ul className="space-y-2">
              {plan.prerequisites?.map((prereq, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span> {prereq}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-100 border-b border-slate-700/50 pb-2">Modules</h3>
          {plan.modules?.map((module, i) => (
            <ModuleCard key={module.id || i} module={module} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ module, index }: { module: Module; index: number }) {
  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-lg font-bold text-indigo-300">
          Module {index + 1}: {module.title}
        </h4>
        <div className="flex gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{module.difficulty}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {module.estimated_duration_hours}h
          </span>
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-4">{module.description}</p>
      
      {/* Lessons */}
      {module.lessons?.length > 0 && (
        <div className="mt-4">
          <h5 className="text-xs font-semibold uppercase text-slate-500 mb-2 tracking-wider">Lessons</h5>
          <div className="space-y-2">
            {module.lessons.map((lesson, i) => (
              <div key={lesson.id || i} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <PlayCircle className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">{lesson.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{lesson.description}</p>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">{lesson.estimated_duration_minutes}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources & Assessments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {module.resources?.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold uppercase text-slate-500 mb-2 tracking-wider">Resources</h5>
            <ul className="space-y-1">
              {module.resources.map((res, i) => (
                <li key={i} className="text-xs text-slate-300">
                  • {res.url ? <a href={res.url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">{res.title}</a> : res.title} 
                  <span className="text-[10px] text-slate-500 ml-1">({res.type})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {module.assessments?.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold uppercase text-slate-500 mb-2 tracking-wider">Assessments</h5>
            <ul className="space-y-1">
              {module.assessments.map((ass, i) => (
                <li key={i} className="text-xs text-slate-300">
                  • <span className="font-medium">{ass.title}</span>: {ass.description}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
