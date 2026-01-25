import React from 'react';
import { render, screen } from '@testing-library/react';
import Tag from './Tag';
import { slugifyTag } from '../helpers/tagUtils';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
});

describe('Tag', () => {
  it('renders a tag with correct text and link', () => {
    const tagName = 'Next.js';
    render(<Tag tag={tagName} />);

    const linkElement = screen.getByRole('link', { name: tagName });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', `/tags/${slugifyTag(tagName)}`);
    expect(linkElement).toHaveTextContent(tagName);
  });

  it('renders a tag with count when provided', () => {
    const tagName = 'TypeScript';
    const tagCount = 5;
    render(<Tag tag={tagName} count={tagCount} />);

    const linkElement = screen.getByRole('link', {
      name: `${tagName} (${tagCount})`,
    });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveTextContent(`${tagName} (${tagCount})`);
  });

  it('applies correct CSS classes', () => {
    const tagName = 'Tailwind CSS';
    render(<Tag tag={tagName} />);

    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveClass('mr-3');
    expect(linkElement).toHaveClass('text-sm');
    expect(linkElement).toHaveClass('font-medium');
    expect(linkElement).toHaveClass('uppercase');
    expect(linkElement).toHaveClass('text-primary-500');
  });

  it('handles tags with special characters by slugifying them', () => {
    const tagName = 'C++ Development';
    render(<Tag tag={tagName} />);

    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', `/tags/${slugifyTag(tagName)}`);
  });
});
