import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { LogOut, Trash, UserMinus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PartyConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  type: 'leave' | 'remove' | 'leave-agent-party' | 'remove-agent';
  partyName: string;
  memberName?: string;
  isOwner?: boolean;
  dialogClassName?: string;
}

export const PartyConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  partyName,
  memberName,
  isOwner = false,
  dialogClassName = 'relative z-50',
}: PartyConfirmationDialogProps) => {
  const { t } = useTranslation('template');
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
  const isLeaveAgentParty = type === 'leave-agent-party';
  const isRemoveAgent = type === 'remove-agent';
  const Icon =
    isLeaveAgentParty || isOwnerLeaving
      ? Trash
      : isLeave
        ? LogOut
        : isRemoveAgent
          ? LogOut
          : UserMinus;
  const copy = isLeaveAgentParty
    ? {
        title: t('partyConfirmation.leaveAgentParty.title'),
        action: t('partyConfirmation.leaveAgentParty.action'),
        processing: t('partyConfirmation.leaveAgentParty.processing'),
        message: t('partyConfirmation.leaveAgentParty.message'),
      }
    : isRemoveAgent
      ? {
          title: t('partyConfirmation.removeAgent.title'),
          action: t('partyConfirmation.removeAgent.action'),
          processing: t('partyConfirmation.removeAgent.processing'),
          message: t('partyConfirmation.removeAgent.message', { memberName }),
        }
      : isOwnerLeaving
        ? {
            title: t('partyConfirmation.deleteParty.title'),
            action: t('partyConfirmation.deleteParty.action'),
            processing: t('partyConfirmation.deleteParty.processing'),
            message: t('partyConfirmation.deleteParty.message', { partyName }),
          }
        : isLeave
          ? {
              title: t('partyConfirmation.leave.title'),
              action: t('partyConfirmation.leave.action'),
              processing: t('partyConfirmation.leave.processing'),
              message: t('partyConfirmation.leave.message', { partyName }),
            }
          : {
              title: t('partyConfirmation.remove.title'),
              action: t('partyConfirmation.remove.action'),
              processing: t('partyConfirmation.remove.processing'),
              message: t('partyConfirmation.remove.message', {
                memberName,
                partyName,
              }),
            };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className={dialogClassName} onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-start align-middle shadow-xl transition-all dark:bg-zinc-800">
                <div className="flex items-center">
                  <div className="me-4 flex-shrink-0">
                    <Icon className="h-8 w-8" />
                  </div>
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    {copy.title}
                  </Dialog.Title>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {copy.message}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-4">
                  <button
                    type="button"
                    className="focus-visible:ring-theme-primary inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:bg-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-600"
                    onClick={onClose}
                    disabled={isProcessing}
                  >
                    {t('partyConfirmation.cancel')}
                  </button>
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-300'}`}
                    onClick={handleConfirm}
                    disabled={isProcessing}
                  >
                    {isProcessing ? copy.processing : copy.action}
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
