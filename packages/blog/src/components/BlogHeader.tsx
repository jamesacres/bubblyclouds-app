'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import ThemeSwitch from '@bubblyclouds-app/ui/components/ThemeSwitch';
import { BlogHeaderProps } from '../types/componentProps';

const BlogHeader = ({ siteMetadata, navLinks }: BlogHeaderProps) => {
  const { headerTitle } = siteMetadata;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative">
      <div className="mx-auto max-w-3xl xl:max-w-5xl">
        <div className="flex items-center justify-between py-10">
          <div>
            <Link href="/" aria-label={headerTitle}>
              {headerTitle && (
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {headerTitle}
                </div>
              )}
            </Link>
          </div>
          <div className="flex items-center space-x-4 leading-5 sm:space-x-6">
            <nav className="hidden sm:flex sm:items-center sm:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 font-medium"
                >
                  {link.title}
                </Link>
              ))}
            </nav>
            <ThemeSwitch />
            <button
              className="sm:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-900 dark:text-gray-100" />
              ) : (
                <Menu className="h-6 w-6 text-gray-900 dark:text-gray-100" />
              )}
            </button>
          </div>
        </div>
      </div>
      {mobileMenuOpen && (
        <nav className="absolute left-0 right-0 top-full z-50 border-t border-gray-200 bg-white py-4 shadow-lg sm:hidden dark:border-gray-700 dark:bg-gray-900">
          <div className="mx-auto max-w-3xl xl:max-w-5xl">
            <div className="flex flex-col space-y-4 px-4">
              {navLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 block font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
};

export default BlogHeader;
