/**
 * LearningAssistant — Premium AI SaaS main experience coordinating header, 280px sidebar, chat interface, and dropzone.
 */
import { useState } from 'react';
import { Menu } from 'lucide-react';
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
  const { uploads, uploadFile, uploadUrl, uploadYoutube, isUploading } = useUpload(sessionId);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleNewSession = async () => {
    const oldSessionId = sessionId;
    clearChat();
    createNewSession();
    // Clean up old session data in the backend (vectors, sources, history)
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
        {/* Desktop 280px Sidebar */}
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

        {/* Mobile Slide-Out Drawer */}
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

        {/* Center Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0B1120] relative">
          {/* Mobile Header Strip */}
          <div className="lg:hidden flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-[#0E1526]">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-xs font-semibold"
            >
              <Menu className="w-4 h-4" />
              <span>Sources & Uploads</span>
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
            onAttach={() => setIsMobileSidebarOpen(true)}
            isStreaming={isStreaming}
            placeholder="Ask anything about your uploaded sources..."
          />
        </main>
      </div>
    </div>
  );
}
