/**
 * Sidebar — 296px responsive SaaS sidebar displaying persistent chat history from Supabase.
 */
import { useState } from 'react';
import { PanelLeftClose, PanelLeft, Clock, MessageSquare, BookOpen, Trash2, Search } from 'lucide-react';
import type { ConversationRecord } from '../../services/conversationService';

interface SidebarProps {
  conversations: ConversationRecord[];
  isLoading: boolean;
  activeSessionId: string;
  onSelectConversation: (sessionId: string) => void;
  onDeleteConversation: (sessionId: string) => void;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Sidebar({
  conversations,
  isLoading,
  activeSessionId,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = searchQuery
    ? conversations.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.last_message_preview || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setDeletingId(sessionId);
    try {
      await onDeleteConversation(sessionId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Collapse toggle button (desktop) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute top-3 left-0 z-40 items-center justify-center w-6 h-8 bg-[#21232A] border border-slate-700/80 rounded-r-xl text-slate-300 hover:text-white transition-colors shadow-md cursor-pointer"
        style={{ left: isCollapsed ? '64px' : '296px' }}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse to rail'}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <PanelLeft className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
      </button>

      {/* Responsive Sidebar */}
      <aside
        className={`bg-[#141519] border-r border-slate-800/70 flex flex-col h-full transition-all duration-250 shrink-0 select-none ${
          isCollapsed ? 'w-[64px] overflow-hidden' : 'w-[296px]'
        } hidden lg:flex z-20 text-slate-200`}
      >
        {/* Header Strip */}
        {isCollapsed ? (
          <div className="py-4 flex flex-col items-center border-b border-slate-800/60 shrink-0">
            <button
              onClick={() => setIsCollapsed(false)}
              title="Chat History"
              className="p-2.5 rounded-xl transition-colors cursor-pointer text-indigo-400 bg-[#252831] border border-slate-700/60"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="px-4 py-3.5 border-b border-slate-800/60 flex items-center gap-2 shrink-0">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-200">Chat History</span>
          </div>
        )}

        {!isCollapsed && (
          <div className="px-3 py-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history…"
                className="w-full pl-8 pr-3 py-2 bg-[#1C1E24] border border-slate-700/50 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>
        )}

        {/* Dynamic Section Content */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-2 pb-3 space-y-1">
          {isCollapsed ? (
            <div className="py-4 flex flex-col items-center text-center my-auto">
              <span className="text-[10px] font-mono text-slate-500 -rotate-90 whitespace-nowrap tracking-widest mt-8">
                {conversations.length} CHATS
              </span>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
              <span className="text-xs">Loading history…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center px-4">
              <MessageSquare className="w-6 h-6 text-slate-600 mb-2" />
              <span className="text-xs font-medium text-slate-400">
                {searchQuery ? 'No matches found' : 'No conversations yet'}
              </span>
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = conv.session_id === activeSessionId;
              const isBeingDeleted = deletingId === conv.session_id;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.session_id)}
                  disabled={isBeingDeleted}
                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer group relative flex flex-col ${
                    isActive
                      ? 'bg-indigo-500/10 border-indigo-500/20'
                      : 'hover:bg-[#1C1E26]'
                  } ${isBeingDeleted ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        conv.mode === 'planner'
                          ? 'bg-purple-500/10 text-purple-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {conv.mode === 'planner'
                          ? <BookOpen className="w-3.5 h-3.5" />
                          : <MessageSquare className="w-3.5 h-3.5" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[13px] font-semibold truncate ${
                            isActive ? 'text-indigo-300' : 'text-slate-200'
                          }`}>
                            {conv.title}
                          </span>
                        </div>
                        {conv.last_message_preview && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-relaxed">
                            {conv.last_message_preview}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-600 font-mono">
                            {timeAgo(conv.updated_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={(e) => handleDelete(e, conv.session_id)}
                      className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-30 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
                      aria-label="Delete conversation"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
