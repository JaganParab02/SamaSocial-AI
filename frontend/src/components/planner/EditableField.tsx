/**
 * EditableField — Interactive inline click-to-edit UI component with ~400ms green autosave flash.
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
  placeholder = 'Click to edit…',
  disabled = false
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState<string | number>(value || '');
  const [showSaveFlash, setShowSaveFlash] = useState(false);
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
      // Trigger ~400ms green border autosave flash confirmation
      setShowSaveFlash(true);
      setTimeout(() => setShowSaveFlash(false), 450);
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
            className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] text-sm p-2 rounded-[var(--radius-sm)] border border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-y leading-relaxed font-reading"
            placeholder={placeholder}
          />
        ) : type === 'select' ? (
          <select
            ref={inputRef as any}
            value={currentVal}
            onChange={(e) => setCurrentVal(e.target.value)}
            onBlur={handleSave}
            className="bg-[var(--bg-input)] text-[var(--text-primary)] text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] font-medium"
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
            className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] text-sm px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] font-medium"
            placeholder={placeholder}
          />
        )}
        <button onClick={handleSave} onMouseDown={(e) => e.preventDefault()} className="p-1.5 text-[var(--success)] hover:opacity-80 transition-opacity cursor-pointer">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={handleCancel} onMouseDown={(e) => e.preventDefault()} className="p-1.5 text-[var(--error)] hover:opacity-80 transition-opacity cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className={`group relative inline-flex items-center gap-1.5 hover:bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] px-1 -mx-1 transition-all cursor-pointer border ${
        showSaveFlash
          ? 'border-[var(--success)] bg-[var(--bg-elevated)] shadow-[0_0_8px_rgba(46,204,113,0.35)]'
          : 'border-transparent hover:border-[var(--border-subtle)]'
      } ${className}`}
      title={disabled ? undefined : "Click to edit field"}
    >
      <span className={!value ? 'italic text-[var(--text-tertiary)]' : ''}>
        {value || placeholder}
      </span>
      {!disabled && (
        <Pencil className="w-3 h-3 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </div>
  );
}
