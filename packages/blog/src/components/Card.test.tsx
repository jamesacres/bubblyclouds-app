import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from './Card';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({
    children,
    href,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    href: string;
    'aria-label'?: string;
  }) => (
    <a href={href} aria-label={ariaLabel}>
      {children}
    </a>
  );
});

// Mock Next.js Image component
jest.mock('next/image', () => {
  return ({
    alt,
    src,
    width,
    height,
    className,
  }: {
    alt: string;
    src: string;
    width: number;
    height: number;
    className: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={src}
      width={width}
      height={height}
      className={className}
    />
  );
});

describe('Card', () => {
  it('renders correctly with title, description, and link', () => {
    render(
      <Card
        title="Test Title"
        description="Test Description"
        href="/test-link"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: 'Link to Test Title' });
    expect(links.length).toBe(2);
    links.forEach((link) => expect(link).toHaveAttribute('href', '/test-link'));
  });

  it('renders with an image when imgSrc is provided', () => {
    render(
      <Card
        title="Image Card"
        description="Description with image"
        imgSrc="/test-image.jpg"
        href="/image-link"
      />
    );

    expect(screen.getByAltText('Image Card')).toHaveAttribute(
      'src',
      '/test-image.jpg'
    );
    const links = screen.getAllByRole('link', { name: 'Link to Image Card' });
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) =>
      expect(link).toHaveAttribute('href', '/image-link')
    );
  });

  it('renders without a link if href is not provided', () => {
    render(
      <Card
        title="No Link Card"
        description="This card has no link"
        imgSrc="/no-link-image.jpg"
      />
    );

    expect(screen.getByText('No Link Card')).toBeInTheDocument();
    expect(screen.getByText('This card has no link')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Link to No Link Card' })
    ).not.toBeInTheDocument();
    expect(screen.getByAltText('No Link Card')).toBeInTheDocument();
  });

  it('renders without an image if imgSrc is not provided', () => {
    render(
      <Card
        title="No Image Card"
        description="Description without image"
        href="/no-image-link"
      />
    );

    expect(screen.getByText('No Image Card')).toBeInTheDocument();
    expect(screen.queryByAltText('No Image Card')).not.toBeInTheDocument();
  });
});
