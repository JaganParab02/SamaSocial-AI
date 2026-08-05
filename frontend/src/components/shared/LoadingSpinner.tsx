/**
 * LoadingSpinner — multi-purpose animated loading indicator.
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

export default function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${sizeMap[size]} rounded-full border-slate-600 border-t-indigo-500 animate-spin`}
      />
      {label && <span className="text-sm text-slate-400">{label}</span>}
    </div>
  );
}
