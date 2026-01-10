'use client';
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // You can also log to an error reporting service here
    // Example: Sentry.captureException(error);
  }

  handleReload = () => {
    // Clear error state and reload
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  handleClearStorage = () => {
    // Clear localStorage and reload - useful for corrupted state
    try {
      localStorage.clear();
      console.log('localStorage cleared');
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white p-8 dark:bg-zinc-900">
          <div className="max-w-md text-center">
            <h1 className="mb-4 text-4xl font-bold text-red-600">
              Oops! Something went wrong
            </h1>
            <p className="mb-6 text-lg text-zinc-700 dark:text-zinc-300">
              We encountered an unexpected error. Don&apos;t worry, your
              progress is saved!
            </p>

            {this.state.error && (
              <details className="mb-6 rounded bg-zinc-100 p-4 text-left text-sm dark:bg-zinc-800">
                <summary className="cursor-pointer font-semibold text-zinc-800 dark:text-zinc-200">
                  Error Details
                </summary>
                <pre className="mt-2 overflow-auto text-xs text-red-600">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="bg-theme-primary hover:bg-theme-primary-dark rounded px-6 py-3 font-semibold text-white transition-colors"
              >
                Reload App
              </button>
              <button
                onClick={this.handleClearStorage}
                className="rounded border border-zinc-300 bg-white px-6 py-3 font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Clear Storage & Reload
              </button>
            </div>

            <p className="mt-6 text-sm text-zinc-500">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
