import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Custom components for MDX rendering
const MDXComponents = {
  Image,
  a: CustomLink,
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img className="mx-auto" {...props} />
  ),
  figure: (props: React.HTMLAttributes<HTMLElement>) => (
    <figure className="my-6" {...props} />
  ),
  figcaption: (props: React.HTMLAttributes<HTMLElement>) => (
    <figcaption
      className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400"
      {...props}
    />
  ),
  // Override p to handle figcaption properly
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => {
    // Check if this paragraph contains only a figcaption
    const children = React.Children.toArray(props.children);
    const hasFigcaption = children.some(
      (child) => React.isValidElement(child) && child.type === 'figcaption'
    );

    if (hasFigcaption) {
      // Don't wrap figcaption in p tag
      return <>{props.children}</>;
    }

    return <p {...props} />;
  },
  // Syntax highlighting is handled by rehype-prism-plus
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <div className="relative">
      <pre {...props} />
    </div>
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => {
    // Check if this is inline code (no className) or code block (has className)
    const { className, ...rest } = props;
    if (className) {
      // This is a code block, let rehype-prism-plus handle it
      return <code className={className} {...rest} />;
    }
    // This is inline code, apply custom styling
    return (
      <code
        className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm text-indigo-600 dark:bg-gray-800 dark:text-indigo-400"
        {...rest}
      />
    );
  },
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
      <Link
        href={href}
        className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
      >
        {children}
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
