export default function Home() {
  return (
    <div className="w-full max-w-xl">
      <p className="text-base leading-relaxed text-stone-600 dark:text-stone-400">
        Hi, I am{' '}
        <a
          href="https://jamesacres.co.uk"
          className="text-theme-primary hover:text-theme-primary-dark font-medium underline underline-offset-2 transition-colors"
        >
          James Acres
        </a>
        ! My personal projects are under the name Bubbly Clouds. My goal is to
        learn and use the latest tools and techniques by creating awesome apps.
      </p>

      <section className="mt-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500">
          Contact me
        </h2>
        <a
          className="hover:border-theme-primary dark:hover:border-theme-primary group flex items-start justify-between rounded-xl border border-stone-200 bg-white px-5 py-5 transition-all hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          rel="noopener noreferrer"
          href="mailto:support@bubblyclouds.com"
        >
          <div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100">
              Email
            </h3>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              support@bubblyclouds.com
            </p>
          </div>
          <span className="group-hover:text-theme-primary ml-4 mt-0.5 shrink-0 text-stone-400 transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
            →
          </span>
        </a>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500">
          Personal Projects
        </h2>
        <a
          href="https://sudoku.bubblyclouds.com"
          className="hover:border-theme-primary dark:hover:border-theme-primary group flex flex-col rounded-xl border border-stone-200 bg-white px-5 py-5 transition-all hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          rel="noopener noreferrer"
        >
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100">
              Sudoku Race
            </h3>
            <span className="group-hover:text-theme-primary ml-4 mt-0.5 shrink-0 text-stone-400 transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-stone-600 dark:text-stone-400">
            <li>
              🤾‍♂️ Share a Sudoku with family and friends — race to finish first
            </li>
            <li>🏎️ Private racing team and leaderboard</li>
            <li>🌱 Sudoku of the day — three new challenges each day</li>
            <li>📖 Monthly puzzle book with technique-focused puzzles</li>
            <li>📸 Import any Sudoku from books, newspapers, or websites</li>
            <li>🎨 Multiple themes in light and dark mode</li>
          </ul>
        </a>
      </section>
    </div>
  );
}
