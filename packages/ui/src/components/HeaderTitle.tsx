'use client';
import { usePathname } from 'next/navigation';

const HeaderTitle = ({ appName }: { appName: string }) => {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return (
    <span className="truncate text-base font-semibold tracking-tight text-stone-800 dark:text-zinc-100">
      {appName}
    </span>
  );
};

export default HeaderTitle;
