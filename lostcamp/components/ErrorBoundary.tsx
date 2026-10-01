import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    console.error('Uncaught error in React Error Boundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-red-950/60 border border-red-800/80 rounded-2xl mx-auto flex items-center justify-center text-red-400 text-2xl font-bold">
              !
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white uppercase tracking-wider font-mono">
                Что-то пошло не так
              </h1>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Произошла непредвиденная ошибка в приложении. Попробуйте обновить страницу.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-left overflow-auto max-h-32 text-xs font-mono text-red-300/80">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-6 bg-[#3a5840] hover:bg-[#2e4733] text-white font-mono text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-[#3a5840]/20 cursor-pointer"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
