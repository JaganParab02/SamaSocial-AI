/**
 * Topbar — Premium SaaS navigation header with inline editable conversation titles, connection status, and actions.
 */
import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Check, User, Sparkles, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConnectionIndicator from '../shared/ConnectionIndicator';

interface TopbarProps {
  sessionId: string;
  pageTitle: string;
  onNewSession: () => void;
}

export default function Topbar({ sessionId, pageTitle, onNewSession }: TopbarProps) {
  const [title, setTitle] = useState('Untitled Conversation');
  const [isEditing, setIsEditing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedName = localStorage.getItem(`session_name_${sessionId}`);
    setTitle(savedName || 'Untitled Conversation');
  }, [sessionId]);

  const saveTitle = () => {
    setIsEditing(false);
    const trimmed = title.trim() || 'Untitled Conversation';
    setTitle(trimmed);
    localStorage.setItem(`session_name_${sessionId}`, trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveTitle();
    if (e.key === 'Escape') setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-[#0E1526]/90 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between px-4 lg:px-6 shrink-0 z-30 shadow-lg">
      {/* Left: Logo & Title */}
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ rotate: 5, scale: 1.05 }}
          className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/25 border border-indigo-400/30"
        >
          <span className="text-lg">🧠</span>
        </motion.div>
        <div className="flex flex-col">
          <span className="text-sm font-extrabold text-slate-100 tracking-tight flex items-center gap-1.5">
            SamaSocial AI
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold uppercase">
              Plus
            </span>
          </span>
          <span className="text-[11px] text-[#9CA3AF] font-medium leading-none mt-0.5">
            {pageTitle || 'Multi-source Learning Assistant'}
          </span>
        </div>
      </div>

      {/* Center: Current Conversation Name (Editable) */}
      <div className="flex items-center justify-center flex-1 max-w-sm px-2">
        {isEditing ? (
          <div className="flex items-center gap-1.5 bg-slate-900 border border-indigo-500 rounded-lg px-2.5 py-1 shadow-inner w-full">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveTitle}
              className="bg-transparent border-none outline-none text-sm text-slate-100 font-medium w-full text-center"
              maxLength={40}
            />
            <button onClick={saveTitle} className="text-emerald-400 hover:text-emerald-300 p-0.5">
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <motion.button
            onClick={() => setIsEditing(true)}
            whileHover={{ scale: 1.02 }}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50 transition-all cursor-pointer text-slate-300 font-medium text-sm"
            title="Click to rename conversation"
          >
            <span className="truncate max-w-[220px] text-slate-200">{title}</span>
            <Pencil className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        )}
      </div>

      {/* Right: Buttons (+ New Chat, Connection Status, Profile) */}
      <div className="flex items-center gap-3">
        <ConnectionIndicator />

        <motion.button
          onClick={onNewSession}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition-all shadow-md shadow-indigo-600/25 border border-indigo-400/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Chat</span>
        </motion.button>

        {/* Profile Avatar Button & Dropdown Menu */}
        <div className="relative" ref={profileRef}>
          <motion.button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl bg-[#1F2937] hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 shadow-sm transition-colors cursor-pointer"
            title="User Account"
          >
            <User className="w-4 h-4 text-indigo-400" />
          </motion.button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-[#111827] border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50 text-slate-200"
              >
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-slate-200">SamaSocial Learner</p>
                  <p className="text-[11px] text-slate-400 truncate">student@navgurukul.org</p>
                </div>
                <div className="py-1">
                  <button className="w-full flex items-center gap-2.5 px-4 py-2 text-xs hover:bg-slate-800/80 transition-colors text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5" /> AI Model: Groq Llama 3
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-4 py-2 text-xs hover:bg-slate-800/80 transition-colors text-slate-300">
                    <Settings className="w-3.5 h-3.5 text-slate-400" /> Preferences
                  </button>
                </div>
                <div className="border-t border-slate-800 pt-1">
                  <button className="w-full flex items-center gap-2.5 px-4 py-2 text-xs hover:bg-red-500/10 text-red-400 transition-colors">
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
