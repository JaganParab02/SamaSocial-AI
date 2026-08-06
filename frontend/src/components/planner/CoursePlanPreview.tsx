/**
 * CoursePlanPreview — Live curriculum preview and visual editor with pinned header, pulsing sync dot, and compact empty state.
 */
import { useState, useEffect } from 'react';
import { BookOpen, Target, Layers, Settings, Plus, AlertCircle, Save, Sparkles, CheckCircle } from 'lucide-react';
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
    <div className="flex-1 overflow-y-auto bg-[#0B1120] text-slate-100 flex flex-col select-none">
      {/* Pinned Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-slate-100 flex items-center gap-3 truncate">
              <span>Live Curriculum Preview</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sync Active
              </span>
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> {getPhaseText(completionPercent)}
              </span>
              {hasUnsavedChanges && (
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3 h-3" /> Unsaved Edits
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveEdits}
              disabled={isSaving}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-[13px] rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving…' : 'Save Edits'}</span>
            </button>
          )}
          <ExportMenu sessionId={sessionId} />
          <button
            onClick={onEditToggle}
            className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-slate-100 text-[13px] font-medium rounded-xl flex items-center gap-2 transition-all border border-slate-700/50 cursor-pointer"
            title="Open raw JSON Code editor"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>JSON Code</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Workspace */}
      <div className="p-8 md:p-12 max-w-5xl mx-auto w-full space-y-12 flex-1">
        
        {/* Course Hero Card */}
        <div className="relative overflow-hidden bg-[#111827] p-10 md:p-12 rounded-[32px] border border-white/5 shadow-2xl space-y-8 group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />
          
          <h1 className="text-[36px] sm:text-[44px] font-bold text-white tracking-tight leading-[1.1] max-w-3xl relative z-10">
            <EditableField
              value={localPlan.title}
              onChange={(val) => handlePlanChange({ ...localPlan, title: String(val) })}
              placeholder="Course Title (e.g. Modern Data Systems & AI)…"
            />
          </h1>

          <div className="text-[16px] text-slate-400 leading-relaxed max-w-3xl relative z-10 font-medium">
            <EditableField
              value={localPlan.description}
              onChange={(val) => handlePlanChange({ ...localPlan, description: String(val) })}
              type="textarea"
              placeholder="Provide a comprehensive summary of the course content and learning methodology…"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 relative z-10">
            <div className="px-5 py-2.5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/5 text-[14px] flex items-center gap-2.5 font-medium text-slate-200 shadow-sm">
              <span className="text-slate-500">Subject</span>
              <div className="w-px h-4 bg-slate-700" />
              <EditableField
                value={localPlan.subject}
                onChange={(val) => handlePlanChange({ ...localPlan, subject: String(val) })}
                placeholder="Domain Topic…"
              />
            </div>
            <div className="px-5 py-2.5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/5 text-[14px] flex items-center gap-2.5 font-medium text-slate-200 shadow-sm">
              <span className="text-slate-500">Audience</span>
              <div className="w-px h-4 bg-slate-700" />
              <EditableField
                value={localPlan.target_audience}
                onChange={(val) => handlePlanChange({ ...localPlan, target_audience: String(val) })}
                placeholder="Who should take this course…"
              />
            </div>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="px-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[15px] font-semibold text-slate-300">Course Completion</span>
            <span className="text-[15px] font-bold text-indigo-400">{completionPercent}%</span>
          </div>
          <div className="w-full h-4 bg-slate-800/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${completionPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          {completionPercent === 100 && (
            <div className="mt-3 text-[13px] font-medium text-emerald-400 flex items-center gap-1.5 justify-end">
              <CheckCircle className="w-4 h-4" /> Ready for Publishing
            </div>
          )}
        </div>

        {/* Outcomes & Prerequisites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#111827] p-8 rounded-3xl shadow-lg border border-transparent hover:border-white/5 transition-colors flex flex-col group/card relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-[16px] font-bold text-slate-200 flex items-center gap-2.5">
                <Target className="w-5 h-5 text-indigo-400" /> Learning Outcomes
              </h3>
              <button
                onClick={() => handlePlanChange({ ...localPlan, learning_outcomes: [...(localPlan.learning_outcomes || []), 'New measurable outcome'] })}
                className="text-[13px] text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium transition-all cursor-pointer opacity-0 group-hover/card:opacity-100"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <ul className="space-y-4 flex-1 relative z-10">
              {(localPlan.learning_outcomes || []).map((outcome, i) => (
                <li key={i} className="text-[15px] text-slate-300 flex items-start gap-3.5 group">
                  <CheckCircle className="w-5 h-5 text-indigo-500/70 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 font-medium">
                    <EditableField
                      value={outcome}
                      onChange={(val) => {
                        const next = [...(localPlan.learning_outcomes || [])];
                        next[i] = String(val);
                        handlePlanChange({ ...localPlan, learning_outcomes: next });
                      }}
                      className="flex-1"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const next = (localPlan.learning_outcomes || []).filter((_, idx) => idx !== i);
                      handlePlanChange({ ...localPlan, learning_outcomes: next });
                    }}
                    aria-label="Delete outcome"
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1 cursor-pointer transition-opacity"
                  >
                    ×
                  </button>
                </li>
              ))}
              {(localPlan.learning_outcomes || []).length === 0 && (
                <li className="text-[14px] text-slate-500 font-medium py-4 text-center">No learning outcomes specified yet.</li>
              )}
            </ul>
          </div>

          <div className="bg-[#111827] p-8 rounded-3xl shadow-lg border border-transparent hover:border-white/5 transition-colors flex flex-col group/card relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-[16px] font-bold text-slate-200 flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-purple-400" /> Prerequisites & Skills
              </h3>
              <button
                onClick={() => handlePlanChange({ ...localPlan, prerequisites: [...(localPlan.prerequisites || []), 'Required prerequisite skill'] })}
                className="text-[13px] text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium transition-all cursor-pointer opacity-0 group-hover/card:opacity-100"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <ul className="space-y-4 flex-1 relative z-10">
              {(localPlan.prerequisites || []).map((prereq, i) => (
                <li key={i} className="text-[15px] text-slate-300 flex items-start gap-3.5 group">
                  <CheckCircle className="w-5 h-5 text-purple-500/70 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 font-medium">
                    <EditableField
                      value={prereq}
                      onChange={(val) => {
                        const next = [...(localPlan.prerequisites || [])];
                        next[i] = String(val);
                        handlePlanChange({ ...localPlan, prerequisites: next });
                      }}
                      className="flex-1"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const next = (localPlan.prerequisites || []).filter((_, idx) => idx !== i);
                      handlePlanChange({ ...localPlan, prerequisites: next });
                    }}
                    aria-label="Delete prerequisite"
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1 cursor-pointer transition-opacity"
                  >
                    ×
                  </button>
                </li>
              ))}
              {(localPlan.prerequisites || []).length === 0 && (
                <li className="text-[14px] text-slate-500 font-medium py-4 text-center">No prerequisite skills listed.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Modules Section */}
        <div className="space-y-8 pt-6">
          <div className="flex items-end justify-between border-b border-white/5 pb-4 px-2">
            <div>
              <h3 className="text-[22px] font-bold text-slate-100 flex items-center gap-3">
                <span>Curriculum Modules</span>
                <span className="px-2.5 py-0.5 bg-slate-800 rounded-lg font-mono text-[13px] text-slate-400">
                  {(localPlan.modules || []).length}
                </span>
              </h3>
            </div>
            <button
              onClick={addModule}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 text-[14px] font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
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
