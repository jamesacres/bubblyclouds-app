import React from 'react';
import { render, screen } from '@testing-library/react';
import TagList from './TagList';
import { TagCount } from '../types';

// Mock the Tag component
jest.mock('./Tag', () => {
  return ({ tag, count }: { tag: string; count?: number }) => (
    <span data-testid="mock-tag">
      {tag}
      {count !== undefined && count > 0 && ` (${count})`}
    </span>
  );
});

describe('TagList', () => {
  const mockTags: TagCount[] = [
    { tag: 'nextjs', displayName: 'Next.js', count: 5 },
    { tag: 'typescript', displayName: 'TypeScript', count: 3 },
    { tag: 'react', displayName: 'React', count: 8 },
  ];

  it('renders a list of tags correctly', () => {
    render(<TagList tags={mockTags} />);

    const tags = screen.getAllByTestId('mock-tag');
    expect(tags.length).toBe(mockTags.length);

    expect(screen.getByText('Next.js (5)')).toBeInTheDocument();
    expect(screen.getByText('TypeScript (3)')).toBeInTheDocument();
    expect(screen.getByText('React (8)')).toBeInTheDocument();
  });

  it('renders empty wrapper when the tags array is empty', () => {
    render(<TagList tags={[]} />);
    expect(screen.queryAllByTestId('mock-tag')).toHaveLength(0);
  });

  it('renders tags without counts if count is not provided (though Tag component mock expects it)', () => {
    const tagsWithoutCount: TagCount[] = [
      { tag: 'css', displayName: 'CSS', count: 0 },
      { tag: 'html', displayName: 'HTML', count: 0 },
    ];
    render(<TagList tags={tagsWithoutCount} />);
    expect(screen.getByText('CSS')).toBeInTheDocument();
    expect(screen.getByText('HTML')).toBeInTheDocument();
    expect(screen.queryByText('CSS (undefined)')).not.toBeInTheDocument(); // Ensure no 'undefined' in output
  });
});
