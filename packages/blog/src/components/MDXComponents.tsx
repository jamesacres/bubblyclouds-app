import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Children } from 'react';

// Custom components for MDX rendering
const MDXComponents = {
  Image,
  a: CustomLink,
  // Custom PrimsJS theme is applied in apps/jamesacres/src/app/globals.css
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => <pre {...props} />,
  // You can add more custom components here
};

function CustomLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const isInternalLink = href && href.startsWith('/');
  const isAnchorLink = href && href.startsWith('#');

  if (isInternalLink) {
    return (
      <Link href={href} legacyBehavior>
        <a className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
          {children}
        </a>
      </Link>
    );
  }

  if (isAnchorLink) {
    return (
      <a
        className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
        href={href}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
      target="_blank"
      rel="noopener noreferrer"
      href={href}
    >
      {children}
    </a>
  );
}

export default MDXComponents;
