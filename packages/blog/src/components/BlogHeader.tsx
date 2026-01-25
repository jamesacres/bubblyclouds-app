import Link from 'next/link';
import ThemeSwitch from '@bubblyclouds-app/ui/components/ThemeSwitch'; // Re-added
import { BlogHeaderProps } from '../types/componentProps';

const BlogHeader = ({ siteMetadata, navLinks }: BlogHeaderProps) => {
  // Updated props
  const { headerTitle, siteLogo } = siteMetadata; // Destructure from siteMetadata
  return (
    <header className="flex items-center justify-between py-10">
      <div>
        <Link href="/" aria-label={headerTitle}>
          {' '}
          {/* Use headerTitle from props */}
          <div className="flex items-center justify-between">
            {siteLogo && ( // Use siteLogo from props
              <div className="mr-3">
                <img src={siteLogo} alt="logo" className="h-6" />
              </div>
            )}
            {headerTitle && ( // Use headerTitle from props
              <div className="hidden h-6 text-2xl font-semibold sm:block">
                {headerTitle}
              </div>
            )}
          </div>
        </Link>
      </div>
      <div className="flex items-center space-x-4 leading-5 sm:space-x-6">
        {navLinks.map(
          (
            link // Use navLinks from props
          ) => (
            <Link
              key={link.title}
              href={link.href}
              className="hidden font-medium text-gray-900 sm:block dark:text-gray-100"
            >
              {link.title}
            </Link>
          )
        )}
        <ThemeSwitch /> {/* Re-added ThemeSwitch component */}
        {/* TODO: Add mobile navigation component */}
      </div>
    </header>
  );
};

export default BlogHeader;
