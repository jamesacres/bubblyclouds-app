import { Children, ReactNode } from 'react';

interface FooterProps {
  children: ReactNode;
  isCapacitor?: () => boolean;
}

const Footer = ({ children, isCapacitor = () => false }: FooterProps) => {
  return (
    <nav
      data-testid="footer"
      className={`${isCapacitor() ? 'pb-safe pt-2' : ''} fixed bottom-0 left-0 z-50 m-auto mt-3 h-20 w-screen items-center justify-between border-t border-stone-200 bg-stone-50/90 px-6 text-sm text-black backdrop-blur-md dark:border-gray-700 dark:bg-zinc-900/90 dark:text-white`}
    >
      <div
        className={`mx-auto grid h-full max-w-lg grid-cols-${Children.count(children)} font-medium`}
      >
        {children}
      </div>
    </nav>
  );
};

export default Footer;
