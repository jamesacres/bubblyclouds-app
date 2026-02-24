'use client';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

import { ChevronLeft } from 'lucide-react';

const HeaderBack = ({ appName }: { appName: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  return pathname === '/' ? (
    <div className="flex items-center">
      <button
        className="cursor-pointer whitespace-nowrap px-3 text-lg font-semibold tracking-tight text-stone-800 transition-opacity hover:opacity-70 active:opacity-50 dark:text-zinc-100"
        onClick={() => router.replace('/?tab=START_PUZZLE')}
      >
        {appName}
      </button>
    </div>
  ) : (
    <button
      className="text-theme-primary dark:text-theme-primary-light flex h-11 cursor-pointer items-center transition-opacity hover:opacity-80 active:opacity-60"
      type="button"
      onClick={() => router.replace('/')}
    >
      <ChevronLeft className="h-5 w-5" />
      <span className="text-base font-medium">Back</span>
    </button>
  );
};

export default HeaderBack;
