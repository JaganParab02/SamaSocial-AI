/**
 * Topbar — Minimalist header styled after Claude UI with understated mode tabs, editable conversation title, and refined action controls.
 */
import { useState, useEffect, useRef } from 'react';
import { Pencil, Check, User, Sparkles, Settings, LogOut, MessageSquare, BookOpen, ChevronDown, History, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import ConnectionIndicator from '../shared/ConnectionIndicator';
import toast from 'react-hot-toast';

interface TopbarProps {
  sessionId: string;
  pageTitle: string;
  onNewSession: () => void;
}

export default function Topbar({ sessionId, pageTitle, onNewSession }: TopbarProps) {
  const [title, setTitle] = useState('Untitled Conversation');
  const [isEditing, setIsEditing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isPlannerMode = location.pathname.includes('/course-planner');

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
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header aria-label={pageTitle} title={pageTitle} className="h-[62px] bg-[#17181C] border-b border-slate-800/80 flex items-center justify-between px-5 lg:px-8 shrink-0 z-30 select-none text-slate-200">
      {/* Left: Brand mark & Minimalist Mode Switcher Tabs */}
      <div className="flex items-center gap-6 md:gap-8 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-base font-extrabold text-slate-100 font-heading tracking-tight">
            SamaSocial
          </span>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#252830] text-indigo-400 border border-slate-700/60 uppercase tracking-wider">
            AI PLUS
          </span>
        </div>

        {/* Spacious Tab Navigation with larger font size and clear separation */}
        <div className="hidden sm:flex items-center gap-3 bg-[#1D1F26] px-2 py-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => navigate('/learning-assistant')}
            aria-pressed={!isPlannerMode}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm md:text-[15px] font-semibold transition-all cursor-pointer ${
              !isPlannerMode ? 'bg-[#2B2E39] text-white shadow-md border border-slate-700/70 scale-[1.02]' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Chat Assistant</span>
          </button>

          <button
            onClick={() => navigate('/course-planner')}
            aria-pressed={isPlannerMode}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm md:text-[15px] font-semibold transition-all cursor-pointer ${
              isPlannerMode ? 'bg-[#2B2E39] text-white shadow-md border border-slate-700/70 scale-[1.02]' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Course Planner</span>
          </button>
        </div>
      </div>

      {/* Center: Inline Editable Conversation Title with Dropdown (Claude Title Style) */}
      <div className="hidden md:flex items-center flex-1 justify-center max-w-md mx-4 relative" ref={historyRef}>
        {isEditing ? (
          <div className="flex items-center gap-1 bg-[#23252C] border border-indigo-500/60 rounded-xl px-3 py-1 shadow-inner">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveTitle}
              className="bg-transparent border-none outline-none text-xs text-slate-100 font-medium w-[220px]"
              maxLength={60}
            />
            <button onClick={saveTitle} aria-label="Save title" className="text-emerald-400 hover:opacity-80 p-0.5 cursor-pointer">
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 group">
            <button
              onClick={() => setIsEditing(true)}
              title="Click to rename conversation"
              aria-label="Rename conversation"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl hover:bg-[#23252C] transition-colors cursor-pointer text-slate-300 hover:text-white font-medium text-xs max-w-[260px]"
            >
              <span className="truncate">{title}</span>
              <Pencil className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            
            <button
              onClick={() => setShowHistoryDropdown((prev) => !prev)}
              title="Recent conversation history"
              aria-label="Toggle recent conversations"
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#23252C] transition-colors cursor-pointer flex items-center"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <AnimatePresence>
          {showHistoryDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-[#21232A] border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 text-slate-200"
            >
              <div className="flex items-center gap-2 px-2.5 py-2 border-b border-slate-700/60 text-xs font-semibold text-slate-400">
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span>Recent Conversations</span>
              </div>
              <div className="py-1 space-y-1 mt-1">
                <button onClick={() => setShowHistoryDropdown(false)} className="w-full text-left px-2.5 py-2 rounded-xl bg-[#2C2F38] hover:bg-[#343742] text-xs text-white font-medium truncate flex items-center justify-between cursor-pointer">
                  <span className="truncate">{title}</span>
                  <span className="text-[10px] font-mono text-emerald-400 shrink-0 ml-2">Active</span>
                </button>
                <button onClick={onNewSession} className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#2A2C35] text-xs text-slate-300 hover:text-white truncate flex items-center justify-between cursor-pointer">
                  <span className="truncate">React & AI Course Plan</span>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">2d ago</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Share CTA (Claude Style), Connection Status, & Profile Avatar */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={() => toast.success('Share link generated to clipboard!')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#24262E] hover:bg-[#2C2E38] border border-slate-700/60 rounded-xl transition-all cursor-pointer shadow-sm"
          title="Share read-only chat link"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        <ConnectionIndicator />

        {/* Profile Avatar Button & Dropdown Menu */}
        <div className="relative ml-1" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            aria-label="Open profile preferences menu"
            className="w-8 h-8 rounded-full bg-[#262932] hover:bg-[#2F323D] border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shadow-sm"
          >
            <User className="w-4 h-4 text-indigo-400" />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2.5 w-60 bg-[#21232A] border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 text-slate-200"
              >
                <div className="px-4 py-2.5 border-b border-slate-700/60">
                  <p className="text-xs font-heading font-semibold text-white">SamaSocial Learner</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">learner@navgurukul.org</p>
                </div>
                <div className="py-1.5 space-y-0.5">
                  <div className="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-indigo-300 font-mono text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Groq Llama-3-70b Active</span>
                  </div>
                  <button className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs hover:bg-[#2A2D37] transition-colors text-slate-200 hover:text-white cursor-pointer rounded-lg mx-1 w-[calc(100%-8px)]">
                    <Settings className="w-3.5 h-3.5 text-slate-400" /> Preferences & API
                  </button>
                </div>
                <div className="border-t border-slate-700/60 pt-1.5 mt-1">
                  <button className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer rounded-lg mx-1 w-[calc(100%-8px)]">
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
