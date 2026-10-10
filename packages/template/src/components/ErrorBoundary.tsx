'use client';
import React, { Component, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // You can also log to an error reporting service here
    // Example: Sentry.captureException(error);
  }

  handleReload = () => {
    // Clear error state and reload
    this.setState({ hasError: false });
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
        <ErrorFallback
          onReload={this.handleReload}
          onClearStorage={this.handleClearStorage}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback = ({
  onReload,
  onClearStorage,
}: {
  onReload: () => void;
  onClearStorage: () => void;
}) => {
  const { t } = useTranslation('template');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-8 dark:bg-zinc-900">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold text-red-600">
          {t('errorBoundary.title')}
        </h1>
        <p className="mb-6 text-lg text-zinc-700 dark:text-zinc-300">
          {t('errorBoundary.description')}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onReload}
            className="bg-theme-primary hover:bg-theme-primary-dark rounded px-6 py-3 font-semibold text-white transition-colors"
          >
            {t('errorBoundary.reload')}
          </button>
          <button
            onClick={onClearStorage}
            className="rounded border border-zinc-300 bg-white px-6 py-3 font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {t('errorBoundary.clearStorage')}
          </button>
        </div>

        <p className="mt-6 text-sm text-zinc-500">
          {t('errorBoundary.contactSupport')}
        </p>
      </div>
    </div>
  );
};

export default ErrorBoundary;
