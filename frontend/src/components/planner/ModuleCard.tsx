/**
 * ModuleCard — Rich interactive accordion container for a course module.
 * Enables live inline modification of objectives, lessons, public resources, and projects.
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, BookOpen, ExternalLink, Award, Target, Video, FileText, Code } from 'lucide-react';
import type { Module, Lesson, Resource } from '../../types/api';
import EditableField from './EditableField';
import LessonCard from './LessonCard';

interface ModuleCardProps {
  module: Module;
  index: number;
  onUpdate: (updated: Module) => void;
  onDelete: () => void;
}

export default function ModuleCard({ module, index, onUpdate, onDelete }: ModuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getDifficultyColor = (diff: string = 'Beginner') => {
    switch (diff.toLowerCase()) {
      case 'beginner': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'intermediate': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getResourceIcon = (type: string = 'article') => {
    switch (type.toLowerCase()) {
      case 'video': return <Video className="w-3.5 h-3.5 text-red-400" />;
      case 'documentation': return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case 'github': return <Code className="w-3.5 h-3.5 text-emerald-400" />;
      default: return <BookOpen className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const addLesson = () => {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: 'New Custom Lesson',
      description: 'Describe lesson objectives and exercises here.',
      estimated_duration_minutes: 30
    };
    onUpdate({ ...module, lessons: [...(module.lessons || []), newLesson] });
  };

  const updateLesson = (idx: number, updated: Lesson) => {
    const nextLessons = [...(module.lessons || [])];
    nextLessons[idx] = updated;
    onUpdate({ ...module, lessons: nextLessons });
  };

  const deleteLesson = (idx: number) => {
    const nextLessons = (module.lessons || []).filter((_, i) => i !== idx);
    onUpdate({ ...module, lessons: nextLessons });
  };

  const addObjective = () => {
    const nextObjs = [...(module.objectives || []), 'New learning objective'];
    onUpdate({ ...module, objectives: nextObjs });
  };

  const updateObjective = (idx: number, text: string) => {
    const nextObjs = [...(module.objectives || [])];
    nextObjs[idx] = text;
    onUpdate({ ...module, objectives: nextObjs });
  };

  const deleteObjective = (idx: number) => {
    const nextObjs = (module.objectives || []).filter((_, i) => i !== idx);
    onUpdate({ ...module, objectives: nextObjs });
  };

  const addResource = () => {
    const newRes: Resource = {
      title: 'MDN / Free Public Reference',
      url: 'https://developer.mozilla.org',
      type: 'documentation'
    };
    onUpdate({ ...module, resources: [...(module.resources || []), newRes] });
  };

  const deleteResource = (idx: number) => {
    const nextRes = (module.resources || []).filter((_, i) => i !== idx);
    onUpdate({ ...module, resources: nextRes });
  };

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 overflow-hidden transition-all shadow-md">
      {/* Module Header Bar */}
      <div className="p-5 bg-slate-800/80 backdrop-blur-md flex items-center justify-between gap-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 flex-1">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-sm flex items-center justify-center shadow">
            M{index + 1}
          </span>
          <div className="flex-1 text-lg font-bold text-white">
            <EditableField
              value={module.title}
              onChange={(val) => onUpdate({ ...module, title: String(val) })}
              placeholder="Module Title..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(module.difficulty)}`}>
              <EditableField
                value={module.difficulty}
                onChange={(val) => onUpdate({ ...module, difficulty: String(val) })}
                type="select"
                options={['Beginner', 'Intermediate', 'Advanced']}
              />
            </span>
            <span className="px-3 py-1 bg-slate-900 rounded-full text-xs text-slate-300 font-mono font-medium border border-slate-700">
              <EditableField
                value={module.estimated_duration_hours}
                onChange={(val) => onUpdate({ ...module, estimated_duration_hours: Number(val) })}
                type="number"
              /> hrs
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            title={isExpanded ? "Collapse Module" : "Expand Module"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
            title="Delete Entire Module"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Accordion Content */}
      {isExpanded && (
        <div className="p-6 space-y-6 bg-slate-900/40">
          {/* Module Description */}
          <div className="text-sm text-slate-300 leading-relaxed italic bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <EditableField
              value={module.description}
              onChange={(val) => onUpdate({ ...module, description: String(val) })}
              type="textarea"
              placeholder="Provide a high-level educational description for this module..."
            />
          </div>

          {/* Learning Objectives */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Module Objectives
              </h4>
              <button
                onClick={addObjective}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
              >
                <Plus className="w-3 h-3" /> Add Objective
              </button>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(module.objectives || []).map((obj, idx) => (
                <li key={idx} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs text-slate-300 group">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-emerald-400 font-bold">•</span>
                    <EditableField
                      value={obj}
                      onChange={(val) => updateObjective(idx, String(val))}
                      className="flex-1"
                    />
                  </div>
                  <button onClick={() => deleteObjective(idx)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Lessons Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Structured Lessons
              </h4>
              <button
                onClick={addLesson}
                className="text-xs bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 px-2.5 py-1 rounded-lg border border-indigo-500/30 font-medium flex items-center gap-1 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> New Lesson
              </button>
            </div>
            <div className="space-y-3">
              {(module.lessons || []).map((lesson, idx) => (
                <LessonCard
                  key={lesson.id || idx}
                  lesson={lesson}
                  index={idx}
                  onUpdate={(upd) => updateLesson(idx, upd)}
                  onDelete={() => deleteLesson(idx)}
                />
              ))}
              {(module.lessons || []).length === 0 && (
                <p className="text-xs text-slate-500 italic py-2 text-center border border-dashed border-slate-800 rounded-xl">
                  No lessons planned in this module yet. Click "New Lesson" to add one!
                </p>
              )}
            </div>
          </div>

          {/* Recommended Public Resources */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Recommended Free Public Resources
              </h4>
              <button
                onClick={addResource}
                className="text-xs bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/20 flex items-center gap-1 transition-all"
              >
                <Plus className="w-3 h-3" /> Add Resource
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {(module.resources || []).map((res, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs group">
                  <div className="flex items-center gap-2.5 truncate flex-1">
                    {getResourceIcon(res.type)}
                    <div className="truncate flex-1">
                      <EditableField
                        value={res.title}
                        onChange={(val) => {
                          const next = [...(module.resources || [])];
                          next[idx] = { ...res, title: String(val) };
                          onUpdate({ ...module, resources: next });
                        }}
                        className="font-semibold text-slate-200"
                      />
                      <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                        <EditableField
                          value={res.url || 'https://'}
                          onChange={(val) => {
                            const next = [...(module.resources || [])];
                            next[idx] = { ...res, url: String(val) };
                            onUpdate({ ...module, resources: next });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {res.url && (
                      <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-400 hover:text-indigo-400 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button onClick={() => deleteResource(idx)} className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects & Assessments (if present) */}
          {((module.projects || []).length > 0 || (module.assessments || []).length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              {(module.projects || []).map((p, i) => (
                <div key={i} className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/20 text-xs">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                    <Award className="w-3.5 h-3.5" /> Project: {p.title} ({p.difficulty})
                  </div>
                  <p className="text-slate-400">{p.description}</p>
                </div>
              ))}
              {(module.assessments || []).map((a, i) => (
                <div key={i} className="bg-blue-500/5 p-3 rounded-xl border border-blue-500/20 text-xs">
                  <div className="font-bold text-blue-400 flex items-center gap-1.5 mb-1">
                    <Target className="w-3.5 h-3.5" /> Assessment: {a.title} ({a.type})
                  </div>
                  <p className="text-slate-400">{a.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
