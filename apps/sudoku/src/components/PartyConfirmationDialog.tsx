import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { LogOut, Trash, UserMinus } from 'react-feather';

interface PartyConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  type: 'leave' | 'remove';
  partyName: string;
  memberName?: string;
  isOwner?: boolean;
}

export const PartyConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  partyName,
  memberName,
  isOwner = false,
}: PartyConfirmationDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error(
        `Error ${type === 'leave' ? 'leaving' : 'removing member from'} party:`,
        error
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const isLeave = type === 'leave';
  const isOwnerLeaving = isLeave && isOwner;
  const Icon = isOwnerLeaving ? Trash : isLeave ? LogOut : UserMinus;
  const title = isOwnerLeaving
    ? 'Delete Party'
    : isLeave
      ? 'Leave Party'
      : 'Remove Member';
  const actionText = isOwnerLeaving
    ? 'Delete Party'
    : isLeave
      ? 'Leave'
      : 'Remove';
  const processingText = isOwnerLeaving
    ? 'Deleting...'
    : isLeave
      ? 'Leaving...'
      : 'Removing...';

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-zinc-800">
                <div className="flex items-center">
                  <div className="mr-4 flex-shrink-0">
                    <Icon className="h-8 w-8" />
                  </div>
                  <Dialog.Title
                    as="h3"
                    className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100"
                  >
                    {title}
                  </Dialog.Title>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isOwnerLeaving
                      ? `Are you sure you want to delete "${partyName}"? This will permanently remove the party and all members will lose access. This action cannot be undone.`
                      : isLeave
                        ? `Are you sure you want to leave "${partyName}"? You will no longer see other members' progress or be able to participate in this party.`
                        : `Are you sure you want to remove "${memberName}" from "${partyName}"? They will no longer be able to participate in this party.`}
                  </p>
                </div>

                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    className="focus-visible:ring-theme-primary inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:bg-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-600"
                    onClick={onClose}
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-300'}`}
                    onClick={handleConfirm}
                    disabled={isProcessing}
                  >
                    {isProcessing ? processingText : actionText}
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
