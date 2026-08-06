/**
 * CoursePlanner — AI SaaS Course Planning Assistant page with 1px split screen and mobile view toggle.
 */
import { useState } from 'react';
import { Menu, MessageSquare, BookOpen, Sparkles } from 'lucide-react';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';
import MobileSidebar from '../components/layout/MobileSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import CoursePlanPreview from '../components/planner/CoursePlanPreview';
import CourseEditor from '../components/planner/CourseEditor';
import { useSession } from '../hooks/useSession';
import { usePlanner } from '../hooks/usePlanner';
import { useSources } from '../hooks/useSources';
import { useUpload } from '../hooks/useUpload';
import { chatService } from '../services/chatService';

export default function CoursePlanner() {
  const { sessionId, createNewSession } = useSession();
  const { messages, isStreaming, sendMessage, stopStreaming, coursePlan, savePlan, isSaving } = usePlanner(sessionId);
  const { sources, isLoading: isLoadingSources, refetch, deleteSource, isDeleting } = useSources(sessionId);
  const { uploads, uploadFile, uploadUrl, uploadYoutube, isUploading } = useUpload(sessionId);
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'plan'>('chat');

  const handleNewSession = async () => {
    const oldSessionId = sessionId;
    createNewSession();
    try {
      await chatService.cleanupSession(oldSessionId);
    } catch {
      // Silently ignore cleanup errors
    }
  };

  const handleRegenerateLast = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage && !isStreaming) {
      sendMessage(lastUserMessage.content);
    }
  };

  // Proactive intake messages if chat is empty
  const defaultIntakeSuggestion = "Design a 4-week introductory curriculum on Machine Learning with hands-on labs and project milestones.";

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-hidden select-none">
      <Topbar
        sessionId={sessionId}
        pageTitle="AI Course Planning Assistant"
        onNewSession={handleNewSession}
      />
      
      {/* Mobile Segmented Toggle Strip (Visible on sub-desktop only) */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 bg-[var(--bg-surface)] border-b border-[var(--border-strong)] z-20">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span>Sources</span>
        </button>

        {/* Segmented Control (Chat / Plan) */}
        <div className="inline-flex rounded-[var(--radius-sm)] p-0.5 bg-[var(--bg-input)] border border-[var(--border-subtle)]">
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex items-center gap-1 px-3 py-1 rounded-[calc(var(--radius-sm)-2px)] text-xs font-semibold transition-all cursor-pointer ${
              mobileTab === 'chat'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Chat</span>
          </button>
          <button
            onClick={() => setMobileTab('plan')}
            className={`flex items-center gap-1 px-3 py-1 rounded-[calc(var(--radius-sm)-2px)] text-xs font-semibold transition-all cursor-pointer ${
              mobileTab === 'plan'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Syllabus Plan</span>
          </button>
        </div>

        <span className="text-[11px] font-mono font-bold text-[var(--accent-primary)] flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Live
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <Sidebar
          sources={sources}
          isLoadingSources={isLoadingSources}
          onDeleteSource={deleteSource}
          onRefreshSources={refetch}
          isDeletingSource={isDeleting}
          uploads={uploads}
          isUploading={isUploading}
          onUploadFile={uploadFile}
          onUploadUrl={uploadUrl}
          onUploadYoutube={uploadYoutube}
        />

        {/* Mobile Sidebar */}
        <MobileSidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          sources={sources}
          isLoadingSources={isLoadingSources}
          onDeleteSource={deleteSource}
          onRefreshSources={refetch}
          isDeletingSource={isDeleting}
          uploads={uploads}
          isUploading={isUploading}
          onUploadFile={uploadFile}
          onUploadUrl={uploadUrl}
          onUploadYoutube={uploadYoutube}
        />

        {/* Center: AI Chat Area (Visible on desktop or when mobileTab is 'chat') */}
        <main className={`${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'} flex-col w-full md:w-1/2 xl:w-2/5 min-w-0 border-r border-[var(--border-strong)] bg-[var(--bg-canvas)] z-10 relative`}>
          {/* Optional Proactive Intake Header */}
          {messages.length === 0 && (
            <div className="px-4 py-2.5 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-center justify-between">
              <span className="font-medium">💡 Proactive Intake: Start by defining your goals or audience</span>
              <button
                onClick={() => sendMessage(defaultIntakeSuggestion)}
                className="text-[var(--accent-primary)] hover:underline font-semibold cursor-pointer shrink-0 ml-2"
              >
                Use sample prompt →
              </button>
            </div>
          )}

          <ChatWindow
            messages={messages}
            isStreaming={isStreaming}
            onSuggestionClick={(query) => sendMessage(query)}
            onRegenerateLast={handleRegenerateLast}
          />
          <ChatInput
            onSend={sendMessage}
            onStop={stopStreaming}
            isStreaming={isStreaming}
            onAttach={() => setIsMobileSidebarOpen(true)}
            placeholder="Instruct the AI to outline, refine, or expand modules…"
          />
        </main>

        {/* Right: Live Curriculum Preview & Editor (Visible on desktop or when mobileTab is 'plan') */}
        <aside className={`${mobileTab === 'plan' ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0 bg-[var(--bg-surface)]`}>
          {coursePlan && !isEditing ? (
            <CoursePlanPreview 
              plan={coursePlan} 
              sessionId={sessionId}
              onEditToggle={() => setIsEditing(true)}
              onSavePlan={(newPlan) => savePlan(newPlan)}
            />
          ) : coursePlan && isEditing ? (
            <CourseEditor 
              plan={coursePlan}
              isSaving={isSaving}
              onSave={(newPlan) => {
                savePlan(newPlan);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <CoursePlanPreview 
              plan={{ title: '', subject: '', description: '', target_audience: '', prerequisites: [], learning_outcomes: [], modules: [] }} 
              sessionId={sessionId}
              onEditToggle={() => {}} 
              onSavePlan={(newPlan) => savePlan(newPlan)}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
