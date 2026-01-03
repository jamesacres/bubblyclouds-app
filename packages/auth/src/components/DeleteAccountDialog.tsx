'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { AlertTriangle } from 'react-feather';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteAccountDialog = ({
  isOpen,
  onClose,
  onConfirm,
}: DeleteAccountDialogProps) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!isConfirmed) return;

    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center">
                  <div className="mr-4 flex-shrink-0">
                    <AlertTriangle className="h-10 w-10 text-red-500" />
                  </div>
                  <Dialog.Title
                    as="h3"
                    className="text-lg leading-6 font-medium text-gray-900"
                  >
                    Delete Account
                  </Dialog.Title>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    This action cannot be undone. All of your data across all
                    Bubbly Clouds applications will be permanently deleted.
                  </p>
                </div>

                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="text-theme-primary focus:ring-theme-primary h-4 w-4 rounded border-gray-300"
                      checked={isConfirmed}
                      onChange={(e) => setIsConfirmed(e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      I confirm that I want to delete my entire account
                      including all data across all Bubbly Clouds applications.
                    </span>
                  </label>
                </div>

                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    className="focus-visible:ring-theme-primary inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    onClick={onClose}
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      isConfirmed
                        ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500'
                        : 'cursor-not-allowed bg-red-300'
                    }`}
                    onClick={handleConfirm}
                    disabled={!isConfirmed || isProcessing}
                  >
                    {isProcessing ? 'Deleting...' : 'Delete Account'}
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
