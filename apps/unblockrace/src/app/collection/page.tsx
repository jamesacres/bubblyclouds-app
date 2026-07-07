'use client';
import { useRouter } from 'next/navigation';

// TODO: implement the monthly collection page (replaces the sudoku puzzle
// book with a monthly set of Unblock Race puzzles, sessions, and progress).
export default function CollectionPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
          Monthly collection
        </h1>
        <p className="mt-2 text-stone-500 dark:text-zinc-400">Coming soon.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-theme-primary hover:bg-theme-primary-dark mt-4 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-200"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
