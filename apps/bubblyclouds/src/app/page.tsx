export default function Home() {
  return (
    <div className="container mx-auto my-10 max-w-xl">
      <p>
        Hi I am{' '}
        <a href="https://jamesacres.co.uk" className="underline">
          James Acres
        </a>
        , trading as Bubbly Clouds.
      </p>
      <p>
        I use the latest tools and techniques to create awesome apps and
        services, in my day job, and to keep up to date with the industry trends
        in my own time.
      </p>
      <h2 className="mt-4 text-lg">Services</h2>
      <div className="my-12 grid w-full max-w-5xl grid-cols-1 text-center">
        <a
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          rel="noopener noreferrer"
          href="mailto:support@bubblyclouds.com"
        >
          <h2 className="mb-3 font-semibold">
            Web and Mobile Application Development and Hosting{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 text-sm opacity-50">
            Contact support@bubblyclouds.com
          </p>
        </a>
      </div>
      <h2 className="mt-4 text-lg">Apps</h2>
      <div className="my-12 grid w-full max-w-5xl grid-cols-1 text-center">
        <a
          href="https://sudoku.bubblyclouds.com"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          rel="noopener noreferrer"
        >
          <h2 className="mb-3 font-semibold">
            Sudoku{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 text-sm opacity-50">
            Simply scan a sudoku from a puzzle book and solve on your device!
          </p>
        </a>
      </div>
    </div>
  );
}
