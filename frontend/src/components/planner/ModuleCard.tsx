/**
 * ModuleCard — Accordion container for a course module with mono index badge and inline customization of objectives, lessons, and resources.
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
      case 'beginner': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'intermediate': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default: return 'bg-slate-800 text-slate-300 border border-white/10';
    }
  };

  const getResourceIcon = (type: string = 'article') => {
    switch (type.toLowerCase()) {
      case 'video': return <Video className="w-4 h-4 text-red-400 shrink-0" />;
      case 'documentation': return <FileText className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'github': return <Code className="w-4 h-4 text-emerald-400 shrink-0" />;
      default: return <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />;
    }
  };

  const addLesson = () => {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: 'New Structured Lesson',
      description: 'Describe lesson objectives and hands-on exercises here.',
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
      title: 'Official Documentation / Reference',
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
    <div className="bg-[#111827] rounded-[28px] border border-white/5 hover:border-white/10 overflow-hidden transition-all shadow-xl hover:shadow-2xl">
      {/* Module Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-6 md:p-8 bg-slate-900/40 cursor-pointer flex flex-wrap items-center justify-between gap-4 transition-colors hover:bg-slate-900/60"
      >
        <div className="flex items-center gap-4 min-w-[240px] flex-1" onClick={(e) => e.stopPropagation()}>
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 text-indigo-400 font-mono font-bold text-[14px] flex items-center justify-center shrink-0 shadow-inner">
            0{index + 1}
          </span>
          <div className="flex-1 text-[18px] sm:text-[20px] font-bold text-slate-100 min-w-0 tracking-tight">
            <EditableField
              value={module.title}
              onChange={(val) => onUpdate({ ...module, title: String(val) })}
              placeholder="Module Title…"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-[13px] font-semibold ${getDifficultyColor(module.difficulty)}`}>
              <span className="mr-1.5">{module.difficulty?.toLowerCase() === 'advanced' ? '🔴' : module.difficulty?.toLowerCase() === 'intermediate' ? '🟡' : '🟢'}</span>
              <EditableField
                value={module.difficulty}
                onChange={(val) => onUpdate({ ...module, difficulty: String(val) })}
                type="select"
                options={['Beginner', 'Intermediate', 'Advanced']}
              />
            </span>
            <span className="px-3.5 py-1 bg-slate-800/60 rounded-full text-[13px] text-slate-300 font-mono font-medium flex items-center gap-1.5">
              <EditableField
                value={module.estimated_duration_hours}
                onChange={(val) => onUpdate({ ...module, estimated_duration_hours: Number(val) })}
                type="number"
              /> 
              <span className="text-slate-500 font-sans">hrs</span>
            </span>
          </div>

          <div className="flex items-center gap-1 border-l border-white/5 pl-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title={isExpanded ? "Collapse Module" : "Expand Module"}
              aria-label={isExpanded ? "Collapse module" : "Expand module"}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            <button
              onClick={onDelete}
              aria-label="Delete module"
              className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
              title="Delete Entire Module"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* When collapsed, show Description preview! */}
      {!isExpanded && module.description && (
        <div className="px-8 pb-6 text-[15px] text-slate-400 font-normal line-clamp-2 leading-relaxed">
          {module.description}
        </div>
      )}

      {/* Expanded Accordion Content */}
      {isExpanded && (
        <div className="p-6 md:p-8 space-y-10 bg-[#111827]">
          {/* Module Description */}
          <div className="text-[15px] text-slate-300 leading-relaxed bg-slate-900/30 p-5 rounded-2xl border border-white/5 font-medium">
            <EditableField
              value={module.description}
              onChange={(val) => onUpdate({ ...module, description: String(val) })}
              type="textarea"
              placeholder="Provide a high-level educational description for this module…"
            />
          </div>

          {/* Learning Objectives */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" /> Objectives
              </h4>
              <button
                onClick={addObjective}
                className="text-[13px] text-slate-300 hover:text-indigo-400 hover:bg-indigo-500/10 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Objective</span>
              </button>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(module.objectives || []).map((obj, idx) => (
                <li key={idx} className="bg-slate-900/50 p-4 rounded-2xl border border-transparent hover:border-white/5 flex items-center justify-between text-[14px] text-slate-200 group transition-all">
                  <div className="flex items-center gap-3 flex-1 min-w-0 font-medium">
                    <span className="text-indigo-400 font-bold shrink-0">•</span>
                    <EditableField
                      value={obj}
                      onChange={(val) => updateObjective(idx, String(val))}
                      className="flex-1 min-w-0"
                    />
                  </div>
                  <button onClick={() => deleteObjective(idx)} aria-label="Delete objective" className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1.5 shrink-0 transition-opacity cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Lessons Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" /> Structured Lessons
              </h4>
              <button
                onClick={addLesson}
                className="text-[13px] bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Lesson</span>
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
                <p className="text-[14px] text-slate-500 italic py-6 text-center bg-slate-900/30 rounded-2xl">
                  No lessons planned in this module yet. Click "New Lesson" to add one!
                </p>
              )}
            </div>
          </div>

          {/* Recommended Public Resources */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-indigo-400" /> Recommended Resources
              </h4>
              <button
                onClick={addResource}
                className="text-[13px] text-slate-300 hover:text-indigo-400 hover:bg-indigo-500/10 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Resource</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(module.resources || []).map((res, idx) => (
                <div key={idx} className="bg-slate-900/60 hover:bg-slate-800/80 p-5 rounded-2xl border border-white/5 flex flex-col justify-between gap-4 transition-all group/res shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/5 text-indigo-400">
                      {getResourceIcon(res.type)}
                    </div>
                    <div className="flex items-center gap-1">
                      {res.url && (
                        <a href={res.url} target="_blank" rel="noopener noreferrer" aria-label="Open reference link" className="p-1.5 text-slate-400 hover:text-slate-100 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => deleteResource(idx)} aria-label="Delete resource" className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover/res:opacity-100 transition-opacity cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-[15px] text-slate-200 truncate">
                      <EditableField
                        value={res.title}
                        onChange={(val) => {
                          const next = [...(module.resources || [])];
                          next[idx] = { ...res, title: String(val) };
                          onUpdate({ ...module, resources: next });
                        }}
                        className="font-bold text-slate-100 truncate"
                      />
                    </div>
                    <div className="text-[12px] text-slate-500 truncate mt-1 font-mono">
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
              ))}
            </div>
          </div>

          {/* Projects & Assessments */}
          {((module.projects || []).length > 0 || (module.assessments || []).length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              {(module.projects || []).map((p, i) => (
                <div key={i} className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 space-y-2">
                  <div className="font-bold text-amber-400 text-[14px] flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    <span>Project: {p.title} ({p.difficulty})</span>
                  </div>
                  <p className="text-slate-400 text-[14px] leading-relaxed font-medium">{p.description}</p>
                </div>
              ))}
              {(module.assessments || []).map((a, i) => (
                <div key={i} className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 space-y-2">
                  <div className="font-bold text-indigo-400 text-[14px] flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>Assessment: {a.title} ({a.type})</span>
                  </div>
                  <p className="text-slate-400 text-[14px] leading-relaxed font-medium">{a.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
