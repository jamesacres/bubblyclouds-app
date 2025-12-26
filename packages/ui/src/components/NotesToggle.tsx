import { Switch } from '@headlessui/react';

export const Toggle = ({
  isEnabled,
  setEnabled,
}: {
  isEnabled: boolean;
  setEnabled: (_value: boolean) => void;
}) => {
  return (
    <Switch
      checked={isEnabled}
      onChange={setEnabled}
      className={`relative flex h-7 w-12 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
        isEnabled ? 'bg-theme-primary' : 'bg-gray-400 dark:bg-gray-600'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          isEnabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </Switch>
  );
};
