'use client';
import { useState } from 'react';
import Link from 'next/link';
import { splitCellId } from '@sudoku-web/sudoku/helpers/calculateId';

// Component that throws an error when triggered
function ErrorThrower({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error(
      'Test React Component Error - This should be caught by ErrorBoundary!'
    );
  }
  return <div>Component is stable</div>;
}

export default function TestErrorsPage() {
  const [throwReactError, setThrowReactError] = useState(false);

  // Test 1: React Component Error (ErrorBoundary)
  const triggerReactError = () => {
    setThrowReactError(true);
  };

  // Test 2: Async/Promise Error (GlobalErrorHandler)
  const triggerAsyncError = () => {
    Promise.reject(
      new Error(
        'Test Async Error - This should be caught by GlobalErrorHandler!'
      )
    );
  };

  // Test 3: Sync JavaScript Error (GlobalErrorHandler)
  const triggerSyncError = () => {
    throw new Error(
      'Test Sync Error - This should be caught by GlobalErrorHandler!'
    );
  };

  // Test 4: Invalid cellId (splitCellId safe defaults)
  const triggerInvalidCellId = () => {
    try {
      console.log('Testing invalid cellId...');
      const result = splitCellId('INVALID_CELL_ID');
      console.log('splitCellId handled gracefully:', result);
      alert('splitCellId returned safe defaults: ' + JSON.stringify(result));
    } catch (e) {
      console.error('splitCellId threw error (should not happen):', e);
      alert('Error: splitCellId threw an exception');
    }
  };

  // Test 5: localStorage Quota Error
  const triggerQuotaError = () => {
    try {
      console.log('Attempting to fill localStorage...');
      let i = 0;
      const data = 'x'.repeat(1024 * 100); // 100KB chunks
      while (true) {
        localStorage.setItem(`test_quota_${i}`, data);
        i++;
        if (i % 10 === 0) {
          console.log(`Written ${i} items (~${(i * 100) / 1024}MB)...`);
        }
      }
    } catch (e) {
      console.log('QuotaExceededError triggered:', e);
      alert(
        'QuotaExceededError triggered! Check console for cleanup logs.\n\nClearing test data...'
      );
      // Clean up test data
      if (typeof localStorage !== 'undefined') {
        Object.keys(localStorage)
          .filter((key) => key.startsWith('test_quota_'))
          .forEach((key) => localStorage.removeItem(key));
      }
      console.log('Test data cleaned up');
    }
  };

  // Test 6: Nested Error in useEffect
  const triggerEffectError = () => {
    // This simulates an error in a useEffect or async operation
    setTimeout(() => {
      throw new Error(
        'Test Effect Error - This should be caught by GlobalErrorHandler!'
      );
    }, 100);
  };

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold text-zinc-900 dark:text-white">
          Error Handling Tests
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Test different error scenarios to verify error handling works
          correctly. Open the browser console to see detailed logs.
        </p>
      </div>

      <div className="space-y-4">
        {/* Test 1: React Component Error */}
        <div className="rounded-lg border border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
            1. React Component Error
          </h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Triggers an error during component rendering. Should be caught by{' '}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">
              ErrorBoundary
            </code>
            , showing a friendly error screen.
          </p>
          <ErrorThrower shouldThrow={throwReactError} />
          <button
            onClick={triggerReactError}
            className="mt-2 rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
          >
            Trigger React Error
          </button>
        </div>

        {/* Test 2: Async Error */}
        <div className="rounded-lg border border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
            2. Async/Promise Error
          </h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Triggers an unhandled promise rejection. Should be caught by{' '}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">
              GlobalErrorHandler
            </code>
            , logged to console, and app continues.
          </p>
          <button
            onClick={triggerAsyncError}
            className="rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
          >
            Trigger Async Error
          </button>
        </div>

        {/* Test 3: Sync Error */}
        <div className="rounded-lg border border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
            3. Sync JavaScript Error
          </h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Triggers a synchronous error in event handler. Should be caught by{' '}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">
              GlobalErrorHandler
            </code>
            , logged to console, and app continues.
          </p>
          <button
            onClick={triggerSyncError}
            className="rounded bg-yellow-600 px-4 py-2 font-semibold text-white hover:bg-yellow-700"
          >
            Trigger Sync Error
          </button>
        </div>

        {/* Test 4: Invalid cellId */}
        <div className="rounded-lg border border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
            4. Invalid CellId (Original Bug)
          </h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Tests the original crash bug. Calls{' '}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">
              splitCellId
            </code>{' '}
            with invalid input. Should return safe defaults without crashing.
          </p>
          <button
            onClick={triggerInvalidCellId}
            className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Test Invalid CellId
          </button>
        </div>

        {/* Test 5: localStorage Quota */}
        <div className="rounded-lg border border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
            5. localStorage Quota Error
          </h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Attempts to fill localStorage until quota is exceeded. Tests our
            cleanup strategy. <strong>Warning:</strong> This will temporarily
            fill your localStorage!
          </p>
          <button
            onClick={triggerQuotaError}
            className="rounded bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
          >
            Trigger Quota Error
          </button>
        </div>

        {/* Test 6: Effect Error */}
        <div className="rounded-lg border border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
            6. Error in Async Effect
          </h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Triggers an error in a setTimeout (simulating useEffect errors).
            Should be caught by{' '}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">
              GlobalErrorHandler
            </code>
            .
          </p>
          <button
            onClick={triggerEffectError}
            className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
          >
            Trigger Effect Error
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-blue-300 bg-blue-50 p-6 dark:border-blue-700 dark:bg-blue-950">
        <h3 className="mb-2 font-bold text-blue-900 dark:text-blue-100">
          Expected Behavior:
        </h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>
            <strong>React Error:</strong> Shows ErrorBoundary fallback UI with
            reload options
          </li>
          <li>
            <strong>Async/Sync/Effect Errors:</strong> Shows iOS-native toast in
            top-right corner + logged to console
          </li>
          <li>
            <strong>Invalid CellId:</strong> Returns safe defaults, shows alert
          </li>
          <li>
            <strong>Quota Error:</strong> Triggers cleanup, shows alert
          </li>
        </ul>
        <div className="mt-4 rounded-lg border border-blue-400 bg-blue-100 p-3 dark:border-blue-600 dark:bg-blue-900">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> You should see an iOS-native toast
            notification appear in the top-right corner for tests 2, 3, and 6.
            Multiple toasts will stack vertically.
          </p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/"
          className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
