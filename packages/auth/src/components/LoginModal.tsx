'use client';

import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { type FormEvent, Fragment, useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogle: () => void;
  onApple: () => void;
  onEmail: (email: string) => void;
  termsUrl: string;
  privacyUrl: string;
  logoSrc: string;
  appName: string;
}

export const LoginModal = ({
  isOpen,
  onClose,
  onGoogle,
  onApple,
  onEmail,
  termsUrl,
  privacyUrl,
  logoSrc,
  appName,
}: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setEmail('');
  }

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onEmail(email.trim());
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full flex-col items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoSrc} alt={appName} className="w-48" />
              </div>
            </TransitionChild>

            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-[354px] overflow-hidden rounded-sm bg-[#F7F7F7] px-10 pb-2.5 pt-5 shadow-[0px_2px_2px_rgba(0,0,0,0.3)]">
                <button
                  onClick={onGoogle}
                  className="mb-0 flex h-10 w-full cursor-pointer items-center rounded-[5px] bg-white p-0 transition-shadow duration-150 ease-in-out hover:shadow-[1px_4px_5px_1px_rgba(0,0,0,0.1)] active:bg-[#e5e5e5] active:shadow-none"
                  style={{ boxShadow: '1px 1px 0px 1px rgba(0,0,0,0.05)' }}
                  type="button"
                >
                  <span className="ml-2 inline-block h-6 w-6 shrink-0 align-middle">
                    <svg
                      viewBox="0 0 366 372"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M125.9 10.2c40.2-13.9 85.3-13.6 125.3 1.1 22.2 8.2 42.5 21 59.9 37.1-5.8 6.3-12.1 12.2-18.1 18.3l-34.2 34.2c-11.3-10.8-25.1-19-40.1-23.6-17.6-5.3-36.6-6.1-54.6-2.2-21 4.5-40.5 15.5-55.6 30.9-12.2 12.3-21.4 27.5-27 43.9-20.3-15.8-40.6-31.5-61-47.3 21.5-43 60.1-76.9 105.4-92.4z"
                        fill="#EA4335"
                      />
                      <path
                        d="M20.6 102.4c20.3 15.8 40.6 31.5 61 47.3-8 23.3-8 49.2 0 72.4-20.3 15.8-40.6 31.6-60.9 47.3C1.9 232.7-3.8 189.6 4.4 149.2c3.3-16.2 8.7-32 16.2-46.8z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M361.7 151.1c5.8 32.7 4.5 66.8-4.7 98.8-8.5 29.3-24.6 56.5-47.1 77.2l-59.1-45.9c19.5-13.1 33.3-34.3 37.2-57.5H186.6c.1-24.2.1-48.4.1-72.6h175z"
                        fill="#4285F4"
                      />
                      <path
                        d="M81.4 222.2c7.8 22.9 22.8 43.2 42.6 57.1 12.4 8.7 26.6 14.9 41.4 17.9 14.6 3 29.7 2.6 44.4.1 14.6-2.6 28.7-7.9 41-16.2l59.1 45.9c-21.3 19.7-48 33.1-76.2 39.6-31.2 7.1-64.2 7.3-95.2-1-24.6-6.5-47.7-18.2-67.6-34.1-20.9-16.6-38.3-38-50.4-62 20.3-15.7 40.6-31.5 60.9-47.3z"
                        fill="#34A853"
                      />
                    </svg>
                  </span>
                  <span className="flex-1 text-center font-['Roboto',arial,sans-serif] text-base font-bold text-[#737373]">
                    Sign in with Google
                  </span>
                </button>

                <button
                  onClick={onApple}
                  className="mt-2 flex h-10 w-full cursor-pointer items-center overflow-hidden rounded-[5px] border border-black bg-black p-0"
                  type="button"
                >
                  <span className="inline-block h-10 w-[39px] shrink-0 align-middle">
                    <svg
                      viewBox="0 0 39 40"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g
                        stroke="none"
                        strokeWidth="1"
                        fill="none"
                        fillRule="evenodd"
                      >
                        <rect
                          fill="#000000"
                          x="0"
                          y="0"
                          width="39"
                          height="44"
                        />
                        <path
                          d="M19.8196726,13.1384615 C20.902953,13.1384615 22.2608678,12.406103 23.0695137,11.4296249 C23.8018722,10.5446917 24.3358837,9.30883662 24.3358837,8.07298156 C24.3358837,7.9051494 24.3206262,7.73731723 24.2901113,7.6 C23.0847711,7.64577241 21.6353115,8.4086459 20.7656357,9.43089638 C20.0790496,10.2090273 19.4534933,11.4296249 19.4534933,12.6807374 C19.4534933,12.8638271 19.4840083,13.0469167 19.4992657,13.1079466 C19.5755531,13.1232041 19.6976128,13.1384615 19.8196726,13.1384615 Z M16.0053051,31.6 C17.4852797,31.6 18.1413509,30.6082645 19.9875048,30.6082645 C21.8641736,30.6082645 22.2761252,31.5694851 23.923932,31.5694851 C25.5412238,31.5694851 26.6245041,30.074253 27.6467546,28.6095359 C28.7910648,26.9312142 29.2640464,25.2834075 29.2945613,25.2071202 C29.1877591,25.1766052 26.0904927,23.9102352 26.0904927,20.3552448 C26.0904927,17.2732359 28.5316879,15.8848061 28.6690051,15.7780038 C27.0517133,13.4588684 24.5952606,13.3978385 23.923932,13.3978385 C22.1082931,13.3978385 20.6283185,14.4963764 19.6976128,14.4963764 C18.6906198,14.4963764 17.36322,13.4588684 15.7917006,13.4588684 C12.8012365,13.4588684 9.765,15.9305785 9.765,20.5993643 C9.765,23.4982835 10.8940528,26.565035 12.2824825,28.548506 C13.4725652,30.2268277 14.5100731,31.6 16.0053051,31.6 Z"
                          fill="#FFFFFF"
                          fillRule="nonzero"
                        />
                      </g>
                    </svg>
                  </span>
                  <span className="flex-1 text-center font-[system-ui] text-base font-bold text-white">
                    Sign in with Apple
                  </span>
                </button>

                <div className="mt-3 border-t border-black pt-2">
                  <p className="mb-2 text-center text-sm font-bold text-black">
                    Sign in with email
                  </p>
                  <form onSubmit={handleEmailSubmit} className="flex">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full rounded-l-[5px] border border-black px-2 py-2 text-base text-black outline-none"
                    />
                    <button
                      type="submit"
                      className="cursor-pointer rounded-r-[5px] border border-black bg-black px-2 py-2 text-sm font-bold text-white"
                    >
                      Continue
                    </button>
                  </form>
                </div>

                <div className="mt-5 w-full text-center text-xs">
                  <button
                    onClick={onClose}
                    className="cursor-pointer font-normal text-gray-900 no-underline"
                    type="button"
                  >
                    Cancel
                  </button>
                  {' | '}
                  <a
                    href={termsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-normal text-gray-900 no-underline"
                  >
                    Terms of Service
                  </a>
                  {' | '}
                  <a
                    href={privacyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-normal text-gray-900 no-underline"
                  >
                    Privacy Policy
                  </a>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
