import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught React error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetLocalData = () => {
    try {
      localStorage.removeItem('gemini_journal_draft');
      localStorage.removeItem('gemini_journal_chat_state');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090B0F] text-slate-200 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#11161D] border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/20 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight">Something went wrong</h2>

            <p className="text-xs text-slate-400 leading-relaxed">
              The application encountered an unexpected render issue. You can reload the page or reset the local reflection draft to restore normal operation.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-[#090B0F] border border-[#30363D] text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-32">
                {this.state.error.message || 'Unknown render error'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleResetLocalData}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#161B22] hover:bg-[#1f242c] text-slate-300 text-xs font-medium rounded-xl border border-[#30363D] transition-all"
                title="Clears cached reflection drafts if corrupt"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Draft</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
