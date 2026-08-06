/**
 * ConversationSidebar — Claude-style sliding drawer showing persistent chat history from Supabase.
 */
import { useState } from 'react';
import { X, Plus, MessageSquare, Trash2, Search, Clock, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConversationRecord } from '../../services/conversationService';

interface ConversationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationRecord[];
  isLoading: boolean;
  activeSessionId: string;
  onSelectConversation: (sessionId: string) => void;
  onNewConversation: () => void;
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

export default function ConversationSidebar({
  isOpen,
  onClose,
  conversations,
  isLoading,
  activeSessionId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationSidebarProps) {
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 w-[320px] bg-[#0F1219] border-r border-white/5 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 pb-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-indigo-400" />
                </div>
                <h2 className="text-[15px] font-bold text-slate-100">Chat History</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Close history"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="px-4 pt-4 pb-2">
              <button
                onClick={() => { onNewConversation(); onClose(); }}
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-[14px] rounded-2xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Conversation
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/5 rounded-xl text-[13px] text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
                  <span className="text-[13px]">Loading conversations…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <MessageSquare className="w-8 h-8 text-slate-600 mb-3" />
                  <span className="text-[14px] font-medium text-slate-400">
                    {searchQuery ? 'No matches found' : 'No conversations yet'}
                  </span>
                  <span className="text-[12px] text-slate-600 mt-1">
                    {searchQuery ? 'Try a different search' : 'Start chatting to create one!'}
                  </span>
                </div>
              ) : (
                filtered.map((conv) => {
                  const isActive = conv.session_id === activeSessionId;
                  const isBeingDeleted = deletingId === conv.session_id;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => { onSelectConversation(conv.session_id); onClose(); }}
                      disabled={isBeingDeleted}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer group relative ${
                        isActive
                          ? 'bg-indigo-500/10 border border-indigo-500/20'
                          : 'hover:bg-slate-800/60 border border-transparent'
                      } ${isBeingDeleted ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            conv.mode === 'planner'
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {conv.mode === 'planner'
                              ? <BookOpen className="w-4 h-4" />
                              : <MessageSquare className="w-4 h-4" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[14px] font-semibold truncate ${
                                isActive ? 'text-indigo-300' : 'text-slate-200'
                              }`}>
                                {conv.title}
                              </span>
                              {isActive && (
                                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                              )}
                            </div>
                            {conv.last_message_preview && (
                              <p className="text-[12px] text-slate-500 truncate mt-0.5 leading-relaxed">
                                {conv.last_message_preview}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[11px] text-slate-600 font-mono">
                                {timeAgo(conv.updated_at)}
                              </span>
                              {conv.message_count > 0 && (
                                <span className="text-[11px] text-slate-600">
                                  · {conv.message_count} msgs
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDelete(e, conv.session_id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
                          aria-label="Delete conversation"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
