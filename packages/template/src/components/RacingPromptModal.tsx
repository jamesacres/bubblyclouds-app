'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Users, Award, Zap, ChevronRight } from 'react-feather';

interface RacingPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRaceMode: () => void;
  onSoloMode: () => void;
}

const RacingPromptModal = ({
  isOpen,
  onClose,
  onRaceMode,
  onSoloMode,
}: RacingPromptModalProps) => {
  const handleRaceMode = () => {
    onRaceMode();
    onClose();
  };

  const handleSoloMode = () => {
    onSoloMode();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white/95 p-6 text-left align-middle shadow-2xl backdrop-blur-md transition-all dark:bg-zinc-900/95">
                {/* Header with racing theme */}
                <div className="mb-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="relative">
                      <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                        <Award className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                        <Zap className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>

                  <Dialog.Title className="mb-2 text-2xl font-bold">
                    <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      Choose Your Challenge Mode
                    </span>
                  </Dialog.Title>

                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    Compete with others or practice solo
                  </p>
                </div>

                {/* Racing option - prominently featured */}
                <button
                  onClick={handleRaceMode}
                  className="group relative mb-4 w-full transform cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-5 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex aspect-square h-12 w-12 items-center justify-center rounded-full bg-white/20 transition-colors group-hover:bg-white/30">
                        <Users className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <div className="mb-1 text-xl font-bold">
                          Race Friends and Family!
                        </div>
                        <div className="text-sm text-white/90">
                          Players can join anytime, but playing simultaneously
                          gives the best racing experience
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                  </div>

                  {/* Animated racing stripes */}
                  <div className="absolute top-0 right-0 left-0 h-1 animate-ping bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </button>

                {/* Solo option - less prominent but still accessible */}
                <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                  <button
                    onClick={handleSoloMode}
                    className="w-full cursor-pointer rounded-xl px-4 py-3 text-sm text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-200"
                  >
                    Solo Challenge
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Export both named and default for compatibility
export { RacingPromptModal };
export default RacingPromptModal;
