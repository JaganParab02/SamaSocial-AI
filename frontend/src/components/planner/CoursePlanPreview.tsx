/**
 * CoursePlanPreview — Live curriculum preview and visual editor with pinned header, pulsing sync dot, and compact empty state.
 */
import { useState, useEffect } from 'react';
import { BookOpen, Target, Layers, Settings, Plus, AlertCircle, Save, Sparkles } from 'lucide-react';
import type { CoursePlan, Module } from '../../types/api';
import { plannerService } from '../../services/plannerService';
import toast from 'react-hot-toast';
import EditableField from './EditableField';
import ModuleCard from './ModuleCard';
import ExportMenu from './ExportMenu';

interface CoursePlanPreviewProps {
  plan: CoursePlan;
  sessionId: string;
  onEditToggle: () => void;
  onSavePlan?: (updated: CoursePlan) => void;
}

export default function CoursePlanPreview({ plan, sessionId, onEditToggle, onSavePlan }: CoursePlanPreviewProps) {
  const [localPlan, setLocalPlan] = useState<CoursePlan>(plan);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalPlan(plan);
    setHasUnsavedChanges(false);
  }, [plan]);

  const handlePlanChange = (updated: CoursePlan) => {
    setLocalPlan(updated);
    setHasUnsavedChanges(true);
  };

  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      if (onSavePlan) {
        onSavePlan(localPlan);
      } else {
        await plannerService.updateCoursePlan(sessionId, localPlan);
      }
      setHasUnsavedChanges(false);
      toast.success('Curriculum synchronized successfully!');
    } catch {
      toast.error('Failed to synchronize changes with server.');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateProgress = (p: CoursePlan) => {
    let score = 0;
    if (p.title && p.title.length > 2) score += 20;
    if (p.subject && p.target_audience) score += 20;
    if ((p.learning_outcomes || []).length >= 2) score += 20;
    if ((p.modules || []).length > 0) {
      score += 20;
      const hasLessons = p.modules.some(m => (m.lessons || []).length > 0);
      const hasResources = p.modules.some(m => (m.resources || []).length > 0);
      if (hasLessons && hasResources) score += 20;
    }
    return Math.min(score, 100);
  };

  const completionPercent = calculateProgress(localPlan);

  const getPhaseText = (pct: number) => {
    if (pct === 0) return 'Phase 0: Ready to outline';
    if (pct < 40) return 'Phase 1: Scope & Audience Definition';
    if (pct < 80) return 'Phase 2: Module Scaffolding';
    if (pct < 100) return 'Phase 3: Resource Curation & Activities';
    return 'Phase 4: Curriculum Complete';
  };

  const addModule = () => {
    const newMod: Module = {
      id: `mod-${Date.now()}`,
      title: 'New Curriculum Module',
      description: 'Module summary description and objectives',
      objectives: ['Primary competency objective'],
      difficulty: 'Beginner',
      estimated_duration_hours: 4.0,
      lessons: [],
      resources: [],
      assessments: [],
      projects: []
    };
    handlePlanChange({ ...localPlan, modules: [...(localPlan.modules || []), newMod] });
  };

  const updateModule = (idx: number, upd: Module) => {
    const next = [...(localPlan.modules || [])];
    next[idx] = upd;
    handlePlanChange({ ...localPlan, modules: next });
  };

  const deleteModule = (idx: number) => {
    const next = (localPlan.modules || []).filter((_, i) => i !== idx);
    handlePlanChange({ ...localPlan, modules: next });
  };

  if (!localPlan.title && (localPlan.modules || []).length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-canvas)] text-[var(--text-secondary)] select-none">
        <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center mb-3.5 text-[var(--accent-primary)] shadow-sm">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-heading font-bold text-[var(--text-primary)]">Your course plan will build here</h3>
        <p className="text-xs max-w-xs mt-1.5 leading-relaxed text-[var(--text-tertiary)] font-reading">
          Chat with the AI on the left to structure your syllabus automatically, or initiate a blank starter plan.
        </p>
        <button
          onClick={addModule}
          className="mt-5 px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] font-heading font-bold text-xs rounded-[var(--radius-sm)] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>Initialize starter template</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col select-none">
      {/* Pinned Sticky Header */}
      <div className="sticky top-0 z-20 bg-[var(--bg-surface)] border-b border-[var(--border-strong)] px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <span className="p-2 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] text-[var(--accent-primary)] border border-[var(--border-subtle)] shrink-0">
            <BookOpen className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-heading font-bold text-[var(--text-primary)] flex items-center gap-2 truncate">
              <span>Live Curriculum Preview</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[10px] font-mono font-semibold text-[var(--text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                <span>Sync Active</span>
              </span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" /> {getPhaseText(completionPercent)}
              </span>
              {hasUnsavedChanges && (
                <span className="text-[10px] bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)] px-2 py-0.5 rounded-[var(--radius-sm)] font-bold flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-2.5 h-2.5" /> Unsaved Edits
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveEdits}
              disabled={isSaving}
              className="px-3 py-1.5 bg-[var(--success)] text-white font-heading font-bold text-xs rounded-[var(--radius-sm)] shadow-sm flex items-center gap-1 transition-opacity hover:opacity-90 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving…' : 'Save Edits'}</span>
            </button>
          )}
          <ExportMenu sessionId={sessionId} />
          <button
            onClick={onEditToggle}
            className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold rounded-[var(--radius-sm)] flex items-center gap-1.5 transition-colors border border-[var(--border-subtle)] cursor-pointer"
            title="Open raw JSON Code editor"
            aria-label="Open JSON editor"
          >
            <Settings className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <span>JSON Code</span>
          </button>
        </div>
      </div>

      {/* Completion Meter Bar */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-6 py-2 flex items-center gap-4 text-xs font-medium">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[var(--text-tertiary)] text-[11px]">Completeness:</span>
          <span className="font-mono font-bold text-[var(--success)] text-xs">{completionPercent}%</span>
        </div>
        <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
          <div
            className="h-full bg-[var(--accent-primary)] transition-all duration-500 rounded-full"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Main Interactive Workspace */}
      <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full space-y-6 flex-1">
        {/* Course Title & Overview Card */}
        <div className="bg-[var(--bg-surface)] p-6 rounded-[var(--radius-lg)] border border-[var(--border-strong)] shadow-sm space-y-4">
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-[var(--text-primary)] tracking-tight">
            <EditableField
              value={localPlan.title}
              onChange={(val) => handlePlanChange({ ...localPlan, title: String(val) })}
              placeholder="Course Title (e.g. Modern Data Systems & AI)…"
            />
          </h1>

          <div className="text-sm text-[var(--text-secondary)] leading-relaxed font-reading bg-[var(--bg-input)] p-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
            <EditableField
              value={localPlan.description}
              onChange={(val) => handlePlanChange({ ...localPlan, description: String(val) })}
              type="textarea"
              placeholder="Provide a comprehensive summary of the course content and learning methodology…"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="px-3 py-1 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-xs flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
              <span className="text-[var(--text-tertiary)] text-[11px]">Subject:</span>
              <EditableField
                value={localPlan.subject}
                onChange={(val) => handlePlanChange({ ...localPlan, subject: String(val) })}
                placeholder="Domain Topic…"
              />
            </div>
            <div className="px-3 py-1 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-xs flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
              <span className="text-[var(--text-tertiary)] text-[11px]">Audience:</span>
              <EditableField
                value={localPlan.target_audience}
                onChange={(val) => handlePlanChange({ ...localPlan, target_audience: String(val) })}
                placeholder="Who should take this course…"
              />
            </div>
          </div>
        </div>

        {/* Outcomes & Prerequisites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--bg-surface)] p-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Key Learning Outcomes
              </h3>
              <button
                onClick={() => handlePlanChange({ ...localPlan, learning_outcomes: [...(localPlan.learning_outcomes || []), 'New measurable outcome'] })}
                className="text-xs text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[var(--accent-primary)]" />
                <span>Add</span>
              </button>
            </div>
            <ul className="space-y-2 flex-1">
              {(localPlan.learning_outcomes || []).map((outcome, i) => (
                <li key={i} className="text-xs text-[var(--text-primary)] flex items-center justify-between gap-2 bg-[var(--bg-input)] p-2.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] group">
                  <span className="text-[var(--accent-primary)] font-bold">•</span>
                  <EditableField
                    value={outcome}
                    onChange={(val) => {
                      const next = [...(localPlan.learning_outcomes || [])];
                      next[i] = String(val);
                      handlePlanChange({ ...localPlan, learning_outcomes: next });
                    }}
                    className="flex-1"
                  />
                  <button
                    onClick={() => {
                      const next = (localPlan.learning_outcomes || []).filter((_, idx) => idx !== i);
                      handlePlanChange({ ...localPlan, learning_outcomes: next });
                    }}
                    aria-label="Delete outcome"
                    className="text-[var(--text-tertiary)] hover:text-[var(--error)] opacity-0 group-hover:opacity-100 p-1 cursor-pointer transition-opacity"
                  >
                    ×
                  </button>
                </li>
              ))}
              {(localPlan.learning_outcomes || []).length === 0 && (
                <li className="text-xs text-[var(--text-tertiary)] italic py-4 text-center">No learning outcomes specified yet.</li>
              )}
            </ul>
          </div>

          <div className="bg-[var(--bg-surface)] p-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Prerequisites & Skills
              </h3>
              <button
                onClick={() => handlePlanChange({ ...localPlan, prerequisites: [...(localPlan.prerequisites || []), 'Required prerequisite skill'] })}
                className="text-xs text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[var(--accent-primary)]" />
                <span>Add</span>
              </button>
            </div>
            <ul className="space-y-2 flex-1">
              {(localPlan.prerequisites || []).map((prereq, i) => (
                <li key={i} className="text-xs text-[var(--text-primary)] flex items-center justify-between gap-2 bg-[var(--bg-input)] p-2.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] group">
                  <span className="text-[var(--accent-primary)] font-bold">•</span>
                  <EditableField
                    value={prereq}
                    onChange={(val) => {
                      const next = [...(localPlan.prerequisites || [])];
                      next[i] = String(val);
                      handlePlanChange({ ...localPlan, prerequisites: next });
                    }}
                    className="flex-1"
                  />
                  <button
                    onClick={() => {
                      const next = (localPlan.prerequisites || []).filter((_, idx) => idx !== i);
                      handlePlanChange({ ...localPlan, prerequisites: next });
                    }}
                    aria-label="Delete prerequisite"
                    className="text-[var(--text-tertiary)] hover:text-[var(--error)] opacity-0 group-hover:opacity-100 p-1 cursor-pointer transition-opacity"
                  >
                    ×
                  </button>
                </li>
              ))}
              {(localPlan.prerequisites || []).length === 0 && (
                <li className="text-xs text-[var(--text-tertiary)] italic py-4 text-center">No prerequisite skills listed.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Modules Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[var(--border-strong)] pb-3">
            <div>
              <h3 className="text-base font-heading font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>Curriculum Modules</span>
                <span className="font-mono text-xs text-[var(--text-tertiary)]">({(localPlan.modules || []).length})</span>
              </h3>
              <p className="text-[11px] text-[var(--text-tertiary)]">Click any title, duration, or objective to edit inline.</p>
            </div>
            <button
              onClick={addModule}
              className="px-3.5 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] text-xs font-heading font-bold rounded-[var(--radius-sm)] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Add Module</span>
            </button>
          </div>

          <div className="space-y-4">
            {(localPlan.modules || []).map((mod, idx) => (
              <ModuleCard
                key={mod.id || idx}
                module={mod}
                index={idx}
                onUpdate={(upd) => updateModule(idx, upd)}
                onDelete={() => deleteModule(idx)}
              />
            ))}
            {(localPlan.modules || []).length === 0 && (
              <div className="p-10 text-center bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] text-[var(--text-tertiary)] text-xs">
                No modules generated yet. Ask the AI to draft your syllabus modules!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
