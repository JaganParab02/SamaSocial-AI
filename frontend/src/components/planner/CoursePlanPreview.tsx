/**
 * CoursePlanPreview — Comprehensive interactive live preview and visual curriculum customization workspace.
 * Includes completion percentage meter, conversational interview steps, unsaved edit tracking, and multi-format exports.
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
      toast.success('Curriculum changes synchronized successfully!');
    } catch (err) {
      toast.error('Failed to save changes to server.');
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
    if (pct === 0) return 'Phase 0: Ready to start interview';
    if (pct < 40) return 'Phase 1: Core Scope & Audience Definition';
    if (pct < 80) return 'Phase 2: Module Scaffolding & Progression';
    if (pct < 100) return 'Phase 3: Resource Curation & Assessments';
    return 'Phase 4: Syllabus Complete & Verified!';
  };

  const addModule = () => {
    const newMod: Module = {
      id: `mod-${Date.now()}`,
      title: 'New Curriculum Module',
      description: 'Module summary description',
      objectives: ['Primary objective'],
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-400">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400 shadow-xl">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-200">Syllabus Workspace Empty</h3>
        <p className="text-xs max-w-sm mt-2 leading-relaxed text-slate-400">
          Chat with the mentor AI on the left or upload a syllabus document in the sidebar to automatically structure a live curriculum!
        </p>
        <button
          onClick={addModule}
          className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Initialize Manually
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0F1D] text-slate-200 flex flex-col">
      {/* Sticky Header & Export Actions */}
      <div className="sticky top-0 z-20 bg-[#0E1526]/95 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <BookOpen className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2 tracking-tight">
              Live Syllabus Design Suite
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {getPhaseText(completionPercent)}
              </span>
              {hasUnsavedChanges && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-2.5 h-2.5" /> Unsaved UI Edits
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveEdits}
              disabled={isSaving}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Sync Updates'}
            </button>
          )}
          <ExportMenu sessionId={sessionId} />
          <button
            onClick={onEditToggle}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
            title="Switch to Raw JSON Code Editor"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" /> JSON Code
          </button>
        </div>
      </div>

      {/* Completion Meter Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-2 flex items-center gap-4 text-xs font-medium">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400">Curriculum Completeness:</span>
          <span className="font-extrabold text-emerald-400">{completionPercent}%</span>
        </div>
        <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Main Interactive Workspace */}
      <div className="p-8 max-w-4xl mx-auto w-full space-y-8 flex-1">
        {/* Course Title & Overview Card */}
        <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
          <h1 className="text-2xl font-black text-white tracking-tight">
            <EditableField
              value={localPlan.title}
              onChange={(val) => handlePlanChange({ ...localPlan, title: String(val) })}
              placeholder="Course Title (e.g. Modern Data Systems & AI)..."
            />
          </h1>

          <div className="text-sm text-slate-300 leading-relaxed font-normal bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <EditableField
              value={localPlan.description}
              onChange={(val) => handlePlanChange({ ...localPlan, description: String(val) })}
              type="textarea"
              placeholder="Provide a comprehensive summary of the course content and learning methodology..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="px-3.5 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs flex items-center gap-1.5 font-semibold text-indigo-300">
              <span className="text-slate-500">Subject:</span>
              <EditableField
                value={localPlan.subject}
                onChange={(val) => handlePlanChange({ ...localPlan, subject: String(val) })}
                placeholder="Domain Topic..."
              />
            </div>
            <div className="px-3.5 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs flex items-center gap-1.5 font-semibold text-purple-300">
              <span className="text-slate-500">Target Audience:</span>
              <EditableField
                value={localPlan.target_audience}
                onChange={(val) => handlePlanChange({ ...localPlan, target_audience: String(val) })}
                placeholder="Who should take this course..."
              />
            </div>
          </div>
        </div>

        {/* Outcomes & Prerequisites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Target className="w-4 h-4" /> Key Learning Outcomes
              </h3>
              <button
                onClick={() => handlePlanChange({ ...localPlan, learning_outcomes: [...(localPlan.learning_outcomes || []), 'New measurable outcome'] })}
                className="text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <ul className="space-y-2 flex-1">
              {(localPlan.learning_outcomes || []).map((outcome, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-center justify-between gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 group">
                  <span className="text-emerald-500 font-bold">•</span>
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
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1"
                  >
                    ×
                  </button>
                </li>
              ))}
              {(localPlan.learning_outcomes || []).length === 0 && (
                <li className="text-xs text-slate-600 italic py-4 text-center">No learning outcomes added yet.</li>
              )}
            </ul>
          </div>

          <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Prerequisites & Skills
              </h3>
              <button
                onClick={() => handlePlanChange({ ...localPlan, prerequisites: [...(localPlan.prerequisites || []), 'Required prerequisite skill'] })}
                className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <ul className="space-y-2 flex-1">
              {(localPlan.prerequisites || []).map((prereq, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-center justify-between gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 group">
                  <span className="text-amber-500 font-bold">•</span>
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
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1"
                  >
                    ×
                  </button>
                </li>
              ))}
              {(localPlan.prerequisites || []).length === 0 && (
                <li className="text-xs text-slate-600 italic py-4 text-center">No prerequisites required.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Modules Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Curriculum Modules ({(localPlan.modules || []).length})
              </h3>
              <p className="text-xs text-slate-400">Click on titles, durations, or objectives to customize inline.</p>
            </div>
            <button
              onClick={addModule}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Module
            </button>
          </div>

          <div className="space-y-6">
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
              <div className="p-12 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 text-slate-500">
                No modules generated yet. Ask the AI mentor to outline your syllabus!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
