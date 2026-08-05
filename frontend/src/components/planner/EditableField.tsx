/**
 * EditableField — Interactive inline click-to-edit UI component for seamless curriculum customization.
 */
import { useState, useEffect, useRef } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface EditableFieldProps {
  value: string | number;
  onChange: (val: string | number) => void;
  type?: 'text' | 'textarea' | 'number' | 'select';
  options?: string[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function EditableField({
  value,
  onChange,
  type = 'text',
  options = [],
  className = '',
  placeholder = 'Click to edit...',
  disabled = false
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState<string | number>(value || '');
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement>(null);

  useEffect(() => {
    setCurrentVal(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type !== 'select') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleSave = () => {
    setIsEditing(false);
    if (currentVal !== value) {
      onChange(type === 'number' ? Number(currentVal) : currentVal);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentVal(value || '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing && !disabled) {
    return (
      <div className="flex items-start gap-1.5 w-full my-0.5 z-20">
        {type === 'textarea' ? (
          <textarea
            ref={inputRef as any}
            value={currentVal}
            onChange={(e) => setCurrentVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            rows={3}
            className="w-full bg-slate-950 text-slate-200 text-sm p-2 rounded-lg border border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y leading-relaxed"
            placeholder={placeholder}
          />
        ) : type === 'select' ? (
          <select
            ref={inputRef as any}
            value={currentVal}
            onChange={(e) => setCurrentVal(e.target.value)}
            onBlur={handleSave}
            className="bg-slate-950 text-slate-200 text-xs px-2 py-1 rounded border border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef as any}
            type={type}
            value={currentVal}
            onChange={(e) => setCurrentVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full bg-slate-950 text-slate-200 text-sm px-2.5 py-1 rounded-lg border border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder={placeholder}
          />
        )}
        <button onClick={handleSave} onMouseDown={(e) => e.preventDefault()} className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={handleCancel} onMouseDown={(e) => e.preventDefault()} className="p-1 text-red-400 hover:text-red-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className={`group relative inline-flex items-center gap-1.5 hover:bg-slate-800/50 rounded px-1 -mx-1 transition-colors cursor-pointer border border-transparent hover:border-slate-700/60 ${className}`}
      title={disabled ? undefined : "Click to edit"}
    >
      <span className={!value ? 'italic text-slate-500' : ''}>
        {value || placeholder}
      </span>
      {!disabled && (
        <Pencil className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </div>
  );
}
