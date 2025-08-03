import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-red-500">Something went wrong</h1>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="mb-4">An error occurred while rendering this page:</p>
              <pre className="bg-gray-900 p-4 rounded overflow-auto text-sm">
                {this.state.error?.toString()}
              </pre>
              <p className="mt-4 text-sm text-gray-400">
                Check the browser console for more details.
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;