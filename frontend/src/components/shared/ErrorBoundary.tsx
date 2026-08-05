/**
 * ErrorBoundary — SaaS Error Boundary to gracefully recover from any UI runtime exceptions without blanking out the page.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component runtime error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6 text-slate-200">
          <div className="max-w-md w-full bg-[#111827] border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Something went wrong</h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              An unexpected runtime error occurred in the component hierarchy. Our fail-safe system captured the issue to protect your state.
            </p>
            {this.state.error && (
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px] font-mono text-red-300 text-left overflow-auto max-h-24">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/25"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reload UI
              </button>
              <button
                onClick={this.handleClearAndReload}
                className="py-2.5 px-3 bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-300 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-700/60"
                title="Reset local state & cache"
              >
                <Trash2 className="w-3.5 h-3.5" /> Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
