'use client';
import BookCover from '@bubblyclouds-app/sudoku/components/BookCover';

export default function TestCoversPage() {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="container mx-auto">
        <h1 className="mb-8 text-center text-4xl font-bold text-white">
          All 12 Monthly Book Covers
        </h1>
        <div className="grid grid-cols-1 justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {months.map((month) => (
            <div key={month} className="flex flex-col items-center">
              <h2 className="mb-4 text-xl font-semibold text-white">{month}</h2>
              <BookCover month={month} size="medium" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
