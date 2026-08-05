/**
 * CoursePlanner — Premium AI SaaS Course Planning Assistant page.
 */
import { useState } from 'react';
import { Menu } from 'lucide-react';
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

  return (
    <div className="h-screen flex flex-col bg-[#0B1120] overflow-hidden">
      <Topbar
        sessionId={sessionId}
        pageTitle="AI Course Planning Assistant"
        onNewSession={handleNewSession}
      />
      
      {/* Main Content */}
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

        {/* Center: Chat Area */}
        <main className="flex flex-col w-full lg:w-1/3 xl:w-2/5 min-w-0 border-r border-slate-800/80 bg-[#0B1120] z-10 relative">
          <div className="lg:hidden flex items-center px-4 py-2.5 border-b border-slate-800 bg-[#0E1526]">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Menu className="w-4 h-4" />
              <span>Sources & Uploads</span>
            </button>
            <span className="text-xs font-bold text-indigo-400">Syllabus Planner</span>
          </div>

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
            placeholder="Instruct the AI planner to generate or refine your syllabus..."
          />
        </main>

        {/* Right: Live Preview / Editor */}
        <aside className="hidden md:flex flex-col flex-1 min-w-0 bg-[#0E1526]">
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
