'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isCapacitor } from '@bubblyclouds-app/template/helpers/capacitor';

function TestersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = searchParams.get('inviteId');

  useEffect(() => {
    if (isCapacitor()) {
      // Go straight to the invite page
      router.replace(`/invite?inviteId=${inviteId}`);
    }
  }, [inviteId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Hero Section */}
        <header className="mb-12 text-center">
          <h1 className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            🚀 Join the Sudoku Race!
          </h1>
          <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
            <p className="text-md text-gray-600 dark:text-gray-300">
              Hi, I&apos;m James Acres, trading as{' '}
              <a href="https://bubblyclouds.com/">Bubbly Clouds</a>.{' '}
              <strong>I need your help</strong> to test my new Sudoku app and
              provide feedback before launch. Please keep the app installed for
              at least the next month and host races with your friends and
              family! Work your way through the monthly book, daily challenges,
              try the camera import.
            </p>
            <p className="text-md mt-4 text-gray-600 dark:text-gray-300">
              Once you have installed the app, join the Racing Team which will
              include a free year of Sudoku Plus premium features. If you
              don&apos;t have an invite link email{' '}
              <a
                href="mailto:james@bubblyclouds.com"
                className="inline-block rounded-lg bg-yellow-400 px-4 py-2 font-bold text-gray-900 shadow-lg transition-all hover:scale-105 hover:bg-yellow-300"
              >
                james@bubblyclouds.com
              </a>{' '}
              and I&apos;ll send one!
            </p>
          </div>
        </header>

        {/* Installation Instructions */}
        <section className="mb-12">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Android */}
            <div className="group rounded-3xl border border-gray-200 bg-white p-10 shadow-xl transition-all hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-8 flex items-center">
                <div className="mr-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-green-500 to-green-600 text-3xl text-white shadow-lg">
                  🤖
                </div>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">
                  Android Users
                </h3>
              </div>
              <ol className="space-y-6">
                <li className="flex items-start">
                  <span className="mt-2 mr-6 flex aspect-square h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-bold text-white shadow-lg">
                    1
                  </span>
                  <div>
                    <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                      Join our{' '}
                      <a
                        href="https://groups.google.com/a/bubblyclouds.com/g/testers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Bubbly Clouds Testers Google Group
                      </a>{' '}
                      and click{' '}
                      <strong className="text-green-600 dark:text-green-400">
                        Join group
                      </strong>
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="mt-2 mr-6 flex aspect-square h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-bold text-white shadow-lg">
                    2
                  </span>
                  <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                    Accept your{' '}
                    <a
                      href="https://play.google.com/apps/testing/com.bubblyclouds.sudoku"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Beta Testing Invitation
                    </a>{' '}
                    and click{' '}
                    <strong className="text-green-600 dark:text-green-400">
                      Become a Tester
                    </strong>
                  </p>
                </li>
                <li className="flex items-start">
                  <span className="mt-2 mr-6 flex aspect-square h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-bold text-white shadow-lg">
                    3
                  </span>
                  <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                    Download{' '}
                    <a
                      href="https://play.google.com/store/apps/details?id=com.bubblyclouds.sudoku&hl=en-US&ah=ITbKJ68PGTBctQ5v5pSRAaHUniM&pli=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Sudoku Race on Google Play
                    </a>
                  </p>
                </li>
                {inviteId && (
                  <li className="flex items-start">
                    <span className="mt-2 mr-6 flex aspect-square h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-bold text-white shadow-lg">
                      4
                    </span>
                    <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                      Join the{' '}
                      <a
                        href={`https://sudoku.bubblyclouds.com/invite?inviteId=${inviteId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <strong>Racing Team</strong>
                      </a>
                    </p>
                  </li>
                )}
              </ol>
            </div>

            {/* iOS */}
            <div className="group rounded-3xl border border-gray-200 bg-white p-10 shadow-xl transition-all hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-8 flex items-center">
                <div className="mr-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500 to-purple-600 text-3xl text-white shadow-lg">
                  📱
                </div>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">
                  iOS Users
                </h3>
              </div>
              <ol className="space-y-6">
                <li className="flex items-start">
                  <span className="mt-2 mr-6 flex aspect-square h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-lg font-bold text-white shadow-lg">
                    1
                  </span>
                  <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                    Open your{' '}
                    <a
                      href="https://testflight.apple.com/join/QMjDmYHu"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      TestFlight Invitation
                    </a>{' '}
                    and{' '}
                    <strong className="text-purple-600 dark:text-purple-400">
                      install Sudoku Race
                    </strong>
                  </p>
                </li>
                {inviteId && (
                  <li className="flex items-start">
                    <span className="mt-2 mr-6 flex aspect-square h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-lg font-bold text-white shadow-lg">
                      2
                    </span>
                    <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                      Join the{' '}
                      <a
                        href={`https://sudoku.bubblyclouds.com/invite?inviteId=${inviteId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <strong>Racing Team</strong>
                      </a>
                    </p>
                  </li>
                )}
              </ol>
            </div>

            {/* Web */}
            <div className="group rounded-3xl border border-gray-200 bg-white p-10 shadow-xl transition-all hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-8 flex items-center">
                <div className="mr-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 text-3xl text-white shadow-lg">
                  🌐
                </div>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">
                  Web Users
                </h3>
              </div>
              <div className="space-y-6">
                <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                  Get started straight away! No installation needed.
                </p>
                {inviteId && (
                  <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                    Join the{' '}
                    <a
                      href={`https://sudoku.bubblyclouds.com/invite?inviteId=${inviteId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <strong>Racing Team</strong>
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Feedback Section */}
        <section className="mb-12">
          <div className="rounded-3xl bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 p-12 text-center text-white shadow-2xl">
            <h2 className="mb-6 text-4xl font-bold">
              💭 Your Feedback Shapes the Future!
            </h2>
            <p className="mb-8 text-xl leading-relaxed">
              As a beta tester, you&apos;re not just playing - you&apos;re
              helping create the next generation of Sudoku gaming. Every bug
              report, feature suggestion, and gameplay comment directly
              influences the final product!
            </p>
            <div className="mb-8 rounded-2xl bg-white/15 p-8 backdrop-blur-sm">
              <div className="mb-6">
                <p className="mb-4 text-2xl font-semibold">
                  🐛 Found a bug? 💡 Have an idea? ❤️ Love something?
                </p>
                <p className="text-xl">Send all feedback directly to:</p>
                <a
                  href="mailto:james@bubblyclouds.com"
                  className="inline-block rounded-lg bg-yellow-400 px-4 py-2 font-bold text-gray-900 shadow-lg transition-all hover:scale-105 hover:bg-yellow-300"
                >
                  james@bubblyclouds.com
                </a>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="rounded-full bg-white/20 px-4 py-2">
                  <span className="font-medium">🚀 Feature Requests</span>
                </div>
                <div className="rounded-full bg-white/20 px-4 py-2">
                  <span className="font-medium">🐛 Bug Reports</span>
                </div>
                <div className="rounded-full bg-white/20 px-4 py-2">
                  <span className="font-medium">🎮 Gameplay Feedback</span>
                </div>
              </div>
            </div>
            <p className="text-xl font-medium opacity-95">
              Thank you for being a crucial part of this exciting journey! 🙏✨
            </p>
          </div>
        </section>

        <section className="mb-12">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 text-2xl text-white shadow-lg">
                🤝
              </div>
              <h3 className="mb-4 text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                Share & Race
              </h3>
              <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                Share any Sudoku puzzle with family and friends instantly - then
                race to see who can solve it fastest!
              </p>
            </div>

            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-2xl text-white shadow-lg">
                🏆
              </div>
              <h3 className="mb-4 text-2xl font-bold text-blue-600 dark:text-blue-400">
                Private Racing Teams
              </h3>
              <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                Create exclusive racing teams with friends and family. Compete
                on private leaderboards and track your progress together!
              </p>
            </div>

            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-2xl text-white shadow-lg">
                📖
              </div>
              <h3 className="mb-4 text-2xl font-bold text-green-600 dark:text-green-400">
                Monthly Puzzle Books
              </h3>
              <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                Technique-focused puzzle collections designed to challenge and
                systematically improve your solving skills.
              </p>
            </div>

            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-2xl text-white shadow-lg">
                📅
              </div>
              <h3 className="mb-4 text-2xl font-bold text-purple-600 dark:text-purple-400">
                Daily Challenges
              </h3>
              <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                Three fresh Sudoku challenges every single day to keep your mind
                sharp and competitive spirit alive!
              </p>
            </div>

            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-2xl text-white shadow-lg">
                📷
              </div>
              <h3 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">
                Camera Import Magic
              </h3>
              <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                Simply scan any Sudoku from books, newspapers, or websites and
                instantly challenge your friends to race!
              </p>
            </div>

            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-2xl text-white shadow-lg">
                🎨
              </div>
              <h3 className="mb-4 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                Beautiful Themes
              </h3>
              <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                Multiple visual themes in both Light and Dark modes to match
                your style and preferences.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Testers() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TestersContent />
    </Suspense>
  );
}
