import { Children, ReactNode } from 'react';

interface FooterProps {
  children: ReactNode;
  isCapacitor?: () => boolean;
}

const Footer = ({ children, isCapacitor = () => false }: FooterProps) => {
  return (
    <nav
      data-testid="footer"
      className={`fixed bottom-0 left-0 z-50 m-auto w-screen border-t border-stone-200/80 bg-stone-50/95 px-6 pb-[env(safe-area-inset-bottom,0px)] text-sm text-black backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/95 dark:text-white ${isCapacitor() ? 'pt-2' : ''}`}
    >
      <div
        className={`mx-auto grid h-20 max-w-lg grid-cols-${Children.count(children)} items-center font-medium`}
      >
        {children}
      </div>
    </nav>
  );
};

export default Footer;
