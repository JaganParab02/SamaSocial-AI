/**
 * ExportMenu — Multi-format syllabus document downloader supporting JSON, Markdown (.md), and PDF reports.
 */
import { useState, useRef, useEffect } from 'react';
import { Download, FileCode, FileText, FileDown, ChevronDown, Loader2 } from 'lucide-react';
import { plannerService } from '../../services/plannerService';
import toast from 'react-hot-toast';

interface ExportMenuProps {
  sessionId: string;
}

export default function ExportMenu({ sessionId }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (format: 'json' | 'markdown' | 'pdf') => {
    setIsOpen(false);
    setIsExporting(true);
    const toastId = toast.loading(`Generating ${format.toUpperCase()} report...`);
    
    try {
      if (format === 'json') {
        const jsonStr = await plannerService.exportCoursePlan(sessionId);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        saveBlob(blob, `course_plan_${sessionId.substring(0, 8)}.json`);
      } else if (format === 'markdown') {
        const mdStr = await plannerService.exportCoursePlanMarkdown(sessionId);
        const blob = new Blob([mdStr], { type: 'text/markdown' });
        saveBlob(blob, `course_syllabus_${sessionId.substring(0, 8)}.md`);
      } else if (format === 'pdf') {
        const pdfBlob = await plannerService.exportCoursePlanPDF(sessionId);
        saveBlob(pdfBlob, `course_syllabus_${sessionId.substring(0, 8)}.pdf`);
      }
      toast.success(`${format.toUpperCase()} report downloaded successfully!`, { id: toastId });
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(`Failed to generate ${format.toUpperCase()}`, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const saveBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700 shadow-sm disabled:opacity-50"
      >
        {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <Download className="w-3.5 h-3.5 text-indigo-400" />}
        <span>Export Syllabus</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right bg-slate-900 rounded-xl border border-slate-700 shadow-2xl py-1.5 z-30 divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
          <div className="py-1">
            <button
              onClick={() => handleDownload('json')}
              className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white flex items-center gap-2.5 transition-colors font-medium"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-semibold">Export JSON</div>
                <div className="text-[10px] text-slate-500">Schema Source of Truth</div>
              </div>
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => handleDownload('markdown')}
              className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white flex items-center gap-2.5 transition-colors font-medium"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <div>
                <div className="font-semibold">Export Markdown</div>
                <div className="text-[10px] text-slate-500">GitHub-flavored Document</div>
              </div>
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => handleDownload('pdf')}
              className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white flex items-center gap-2.5 transition-colors font-medium"
            >
              <FileDown className="w-4 h-4 text-red-400" />
              <div>
                <div className="font-semibold">Export PDF Report</div>
                <div className="text-[10px] text-slate-500">Printable A4 Document</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
