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
      case 'beginner': return 'bg-[var(--bg-elevated)] text-[var(--success)] border border-[var(--border-subtle)]';
      case 'intermediate': return 'bg-[var(--bg-elevated)] text-amber-400 border border-[var(--border-subtle)]';
      case 'advanced': return 'bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)]';
      default: return 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]';
    }
  };

  const getResourceIcon = (type: string = 'article') => {
    switch (type.toLowerCase()) {
      case 'video': return <Video className="w-3.5 h-3.5 text-red-400 shrink-0" />;
      case 'documentation': return <FileText className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />;
      case 'github': return <Code className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />;
      default: return <BookOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
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
    <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-strong)] overflow-hidden transition-all shadow-sm">
      {/* Module Header Bar */}
      <div className="p-4 sm:p-5 bg-[var(--bg-elevated)] flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3 min-w-[220px] flex-1">
          <span className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-strong)] text-[var(--text-primary)] font-mono font-bold text-xs flex items-center justify-center shrink-0">
            M{index + 1}
          </span>
          <div className="flex-1 text-sm sm:text-base font-heading font-bold text-[var(--text-primary)] min-w-0">
            <EditableField
              value={module.title}
              onChange={(val) => onUpdate({ ...module, title: String(val) })}
              placeholder="Module Title…"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-mono font-semibold ${getDifficultyColor(module.difficulty)}`}>
              <EditableField
                value={module.difficulty}
                onChange={(val) => onUpdate({ ...module, difficulty: String(val) })}
                type="select"
                options={['Beginner', 'Intermediate', 'Advanced']}
              />
            </span>
            <span className="px-2.5 py-0.5 bg-[var(--bg-canvas)] rounded-[var(--radius-sm)] text-xs text-[var(--text-secondary)] font-mono font-medium border border-[var(--border-subtle)]">
              <EditableField
                value={module.estimated_duration_hours}
                onChange={(val) => onUpdate({ ...module, estimated_duration_hours: Number(val) })}
                type="number"
              /> hrs
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            className="p-1.5 hover:bg-[var(--bg-canvas)] rounded-[var(--radius-sm)] text-[var(--text-secondary)] transition-colors cursor-pointer"
            title={isExpanded ? "Collapse Module" : "Expand Module"}
            aria-label={isExpanded ? "Collapse module" : "Expand module"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={onDelete}
            aria-label="Delete module"
            className="p-1.5 hover:bg-[var(--error-bg)] text-[var(--text-tertiary)] hover:text-[var(--error)] rounded-[var(--radius-sm)] transition-colors cursor-pointer"
            title="Delete Entire Module"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Accordion Content */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6 bg-[var(--bg-surface)]">
          {/* Module Description */}
          <div className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-reading bg-[var(--bg-input)] p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
            <EditableField
              value={module.description}
              onChange={(val) => onUpdate({ ...module, description: String(val) })}
              type="textarea"
              placeholder="Provide a high-level educational description for this module…"
            />
          </div>

          {/* Learning Objectives */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Module Objectives
              </h4>
              <button
                onClick={addObjective}
                className="text-xs text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[var(--accent-primary)]" />
                <span>Add Objective</span>
              </button>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(module.objectives || []).map((obj, idx) => (
                <li key={idx} className="bg-[var(--bg-input)] p-2.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-primary)] group">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[var(--accent-primary)] font-bold shrink-0">•</span>
                    <EditableField
                      value={obj}
                      onChange={(val) => updateObjective(idx, String(val))}
                      className="flex-1 min-w-0"
                    />
                  </div>
                  <button onClick={() => deleteObjective(idx)} aria-label="Delete objective" className="text-[var(--text-tertiary)] hover:text-[var(--error)] opacity-0 group-hover:opacity-100 p-1 shrink-0 transition-opacity cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Lessons Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Structured Lessons
              </h4>
              <button
                onClick={addLesson}
                className="text-xs bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--border-strong)] font-heading font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
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
                <p className="text-xs text-[var(--text-tertiary)] italic py-3 text-center border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-md)]">
                  No lessons planned in this module yet. Click "New Lesson" to add one!
                </p>
              )}
            </div>
          </div>

          {/* Recommended Public Resources */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Recommended Resources
              </h4>
              <button
                onClick={addResource}
                className="text-xs text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[var(--accent-primary)]" />
                <span>Add Resource</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {(module.resources || []).map((res, idx) => (
                <div key={idx} className="bg-[var(--bg-input)] p-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs group">
                  <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                    {getResourceIcon(res.type)}
                    <div className="truncate flex-1 min-w-0">
                      <EditableField
                        value={res.title}
                        onChange={(val) => {
                          const next = [...(module.resources || [])];
                          next[idx] = { ...res, title: String(val) };
                          onUpdate({ ...module, resources: next });
                        }}
                        className="font-heading font-bold text-[var(--text-primary)] truncate"
                      />
                      <div className="text-[11px] text-[var(--text-tertiary)] truncate mt-0.5 font-mono">
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
                  <div className="flex items-center gap-1.5 shrink-0">
                    {res.url && (
                      <a href={res.url} target="_blank" rel="noopener noreferrer" aria-label="Open reference link" className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button onClick={() => deleteResource(idx)} aria-label="Delete resource" className="p-1 text-[var(--text-tertiary)] hover:text-[var(--error)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects & Assessments */}
          {((module.projects || []).length > 0 || (module.assessments || []).length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[var(--border-subtle)]">
              {(module.projects || []).map((p, i) => (
                <div key={i} className="bg-[var(--bg-input)] p-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-xs">
                  <div className="font-heading font-bold text-[var(--accent-primary)] flex items-center gap-1.5 mb-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>Project: {p.title} ({p.difficulty})</span>
                  </div>
                  <p className="text-[var(--text-secondary)] font-reading">{p.description}</p>
                </div>
              ))}
              {(module.assessments || []).map((a, i) => (
                <div key={i} className="bg-[var(--bg-input)] p-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-xs">
                  <div className="font-heading font-bold text-[var(--accent-primary)] flex items-center gap-1.5 mb-1">
                    <Target className="w-3.5 h-3.5" />
                    <span>Assessment: {a.title} ({a.type})</span>
                  </div>
                  <p className="text-[var(--text-secondary)] font-reading">{a.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
