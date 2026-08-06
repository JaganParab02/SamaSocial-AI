/**
 * LearningAssistant — Premium AI SaaS main experience coordinating header, sidebar, chat interface, and composer dropzone.
 */
import { useState } from 'react';
import { Menu, CloudUpload } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';
import MobileSidebar from '../components/layout/MobileSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import { useSession } from '../hooks/useSession';
import { useChat } from '../hooks/useChat';
import { useSources } from '../hooks/useSources';
import { useUpload } from '../hooks/useUpload';
import { chatService } from '../services/chatService';

export default function LearningAssistant() {
  const { sessionId, createNewSession } = useSession();
  const { messages, isStreaming, sendMessage, stopStreaming, clearChat } = useChat(sessionId);
  const { sources, isLoading: isLoadingSources, refetch, deleteSource, isDeleting } = useSources(sessionId);
  const { uploads, uploadFile, uploadUrl, uploadYoutube, removeUpload, retryUpload, clearCompleted, isUploading } = useUpload(sessionId);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleNewSession = async () => {
    const oldSessionId = sessionId;
    clearChat();
    createNewSession();
    try {
      await chatService.cleanupSession(oldSessionId);
    } catch {
      // Silently ignore cleanup errors for old sessions
    }
  };

  const handleRegenerateLast = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage && !isStreaming) {
      sendMessage(lastUserMessage.content);
    }
  };

  const handleDropFiles = (files: FileList) => {
    if (isUploading || uploads.some((u) => u.status === 'uploading' || u.status === 'processing')) {
      toast.error('Waiting for current attachments to finish processing');
      return;
    }
    const fileArray = Array.from(files);
    const currentCount = uploads.length;
    if (currentCount >= 5) {
      toast('You can attach up to 5 files at once — remove one to add another.', { icon: '⚠️' });
      return;
    }
    const allowed = 5 - currentCount;
    if (fileArray.length > allowed) {
      toast('You can attach up to 5 files at once — remove one to add another.', { icon: '⚠️' });
    }
    fileArray.slice(0, allowed).forEach((file) => {
      uploadFile(file);
    });
  };

  return (
    <div className="h-screen flex flex-col bg-[#0B1120] overflow-hidden">
      {/* Top Navigation */}
      <Topbar
        sessionId={sessionId}
        pageTitle="Multi-Source Learning Assistant"
        onNewSession={handleNewSession}
      />

      {/* Main Content Viewport */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop 296px Sidebar */}
        <Sidebar
          sources={sources}
          isLoadingSources={isLoadingSources}
          onDeleteSource={deleteSource}
          onRefreshSources={refetch}
          isDeletingSource={isDeleting}
        />

        {/* Mobile Slide-Out Drawer */}
        <MobileSidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          sources={sources}
          isLoadingSources={isLoadingSources}
          onDeleteSource={deleteSource}
          onRefreshSources={refetch}
          isDeletingSource={isDeleting}
        />

        {/* Center Chat Area with conversation drop target (§1.1) */}
        <main
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files?.length) {
              handleDropFiles(e.dataTransfer.files);
            }
          }}
          className="flex-1 flex flex-col min-w-0 bg-[#0B1120] relative"
        >
          {/* Dashed drop overlay (§1.1) */}
          {isDragOver && (
            <div className="absolute inset-0 z-50 bg-[#0B1120]/85 border-2 border-dashed border-indigo-500 flex flex-col items-center justify-center p-6 text-center select-none backdrop-blur-xs pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-[#1F2437] border border-indigo-500/50 flex items-center justify-center mb-4 shadow-2xl text-indigo-400 animate-bounce">
                <CloudUpload className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold font-heading text-white tracking-wide">Drop to add to this conversation</h3>
              <p className="text-xs text-slate-400 mt-1">Supports PDF, PPTX, DOCX, and TXT files (max 5 simultaneously)</p>
            </div>
          )}

          {/* Mobile Header Strip */}
          <div className="lg:hidden flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-[#0E1526]">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-xs font-semibold"
            >
              <Menu className="w-4 h-4" />
              <span>Knowledge Base</span>
            </button>
            <span className="text-xs font-mono text-indigo-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {sources.length} indexed asset{sources.length !== 1 ? 's' : ''}
            </span>
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
            onClear={clearChat}
            isStreaming={isStreaming}
            placeholder="Ask anything about your uploaded sources..."
            uploads={uploads}
            isUploading={isUploading}
            onUploadFile={uploadFile}
            onUploadUrl={uploadUrl}
            onUploadYoutube={uploadYoutube}
            onRemoveUpload={removeUpload}
            onRetryUpload={retryUpload}
            onClearCompleted={clearCompleted}
          />
        </main>
      </div>
    </div>
  );
}
