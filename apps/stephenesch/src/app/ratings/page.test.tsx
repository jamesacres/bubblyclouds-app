import React from 'react';
import { render, screen } from '@testing-library/react';
import RatingsPage from './page';
import * as postsModule from '@bubblyclouds-app/blog/helpers/posts';
import * as tagUtilsModule from '@bubblyclouds-app/blog/helpers/tagUtils';

jest.mock('@bubblyclouds-app/blog/helpers/posts');
jest.mock('@bubblyclouds-app/blog/helpers/tagUtils');
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
}));
jest.mock('@/components/StarsRating', () => ({
  StarsRating: ({ rating }: { rating: number }) => (
    <div data-testid={`stars-rating-${rating}`}>{rating} stars</div>
  ),
}));

describe('RatingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render page with heading', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue([]);

    render(await RatingsPage());

    expect(
      screen.getByRole('heading', { name: /explore ratings/i })
    ).toBeInTheDocument();
  });

  it('should display rating section heading', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue([]);

    render(await RatingsPage());

    expect(screen.getByText('Rating:')).toBeInTheDocument();
  });

  it('should display decade section heading', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue([]);

    render(await RatingsPage());

    expect(screen.getByText('Decade:')).toBeInTheDocument();
  });

  it('should display artist section heading', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue([]);

    render(await RatingsPage());

    expect(screen.getByText('Artist:')).toBeInTheDocument();
  });

  it('should render all 10 rating levels (10 to 1)', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue([]);

    render(await RatingsPage());

    // Check for all 10 rating levels
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByTestId(`stars-rating-${i}`)).toBeInTheDocument();
    }
  });

  it('should render all 9 decades from 1940 to 2020', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue([]);

    render(await RatingsPage());

    for (let decade = 1940; decade <= 2020; decade += 10) {
      expect(screen.getByText(new RegExp(`${decade}`))).toBeInTheDocument();
    }
  });

  it('should display rating links with correct href', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue([]);

    const { container } = render(await RatingsPage());

    // Check for rating links (10->5.0->"5", 9->4.5->"45", 8->4.0->"4")
    const ratingLinks = container.querySelectorAll('a[href*="/tags/rated-"]');
    expect(ratingLinks.length).toBeGreaterThanOrEqual(2);

    const hrefs = Array.from(ratingLinks).map((link) =>
      link.getAttribute('href')
    );
    expect(hrefs).toContain('/tags/rated-5');
    expect(hrefs).toContain('/tags/rated-45');
  });

  it('should display decade links with correct href', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue([]);

    render(await RatingsPage());

    expect(
      screen.getByTestId('link-/tags/release-decade-1940')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('link-/tags/release-decade-2020')
    ).toBeInTheDocument();
  });

  it('should display tag counts from getAllPosts', async () => {
    const mockTags = [
      { tag: 'rated-5', count: 5 },
      { tag: 'rated-45', count: 3 },
      { tag: 'release-decade-2000', count: 8 },
      { tag: 'artist-the-beatles', count: 2 },
    ];

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue(mockTags);

    const { container } = render(await RatingsPage());

    // Check that counts are displayed (counts appear with parentheses)
    const text = container.textContent;
    expect(text).toContain('(5)');
    expect(text).toContain('(3)');
    expect(text).toContain('(8)');
  });

  it('should handle missing tag counts with 0', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue([]);

    render(await RatingsPage());

    // When no tags, all counts should show (0)
    const countElements = screen.getAllByText(/\(0\)/);
    expect(countElements.length).toBeGreaterThan(0);
  });

  it('should filter and display artist tags', async () => {
    const mockTags = [
      { tag: 'artist-the-beatles', count: 10 },
      { tag: 'artist-pink-floyd', count: 8 },
      { tag: 'rated-50', count: 5 },
      { tag: 'release-decade-1970', count: 12 },
    ];

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue(mockTags);

    render(await RatingsPage());

    // Should display artist links
    expect(
      screen.getByTestId('link-/tags/artist-the-beatles')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('link-/tags/artist-pink-floyd')
    ).toBeInTheDocument();
  });

  it('should format artist names correctly (remove prefix and dashes)', async () => {
    const mockTags = [
      { tag: 'artist-the-beatles', count: 10 },
      { tag: 'artist-pink-floyd', count: 8 },
    ];

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue(mockTags);

    render(await RatingsPage());

    expect(screen.getByText('THE BEATLES (10)')).toBeInTheDocument();
    expect(screen.getByText('PINK FLOYD (8)')).toBeInTheDocument();
  });

  it('should sort artists alphabetically', async () => {
    const mockTags = [
      { tag: 'artist-zebra', count: 1 },
      { tag: 'artist-apple', count: 2 },
      { tag: 'artist-banana', count: 3 },
    ];

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue(mockTags);

    render(await RatingsPage());

    const artistLinks = screen.getAllByTestId(/link-\/tags\/artist-/);
    expect(artistLinks[0]).toHaveAttribute('href', '/tags/artist-apple');
    expect(artistLinks[1]).toHaveAttribute('href', '/tags/artist-banana');
    expect(artistLinks[2]).toHaveAttribute('href', '/tags/artist-zebra');
  });

  it('should call getAllPosts and getTagCounts on render', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue([]);

    await RatingsPage();

    expect(postsModule.getAllPosts).toHaveBeenCalled();
    expect(tagUtilsModule.getTagCounts).toHaveBeenCalled();
  });

  it('should pass posts to getTagCounts', async () => {
    const mockPosts = [{ slug: 'post-1' }, { slug: 'post-2' }];

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue([]);

    await RatingsPage();

    expect(tagUtilsModule.getTagCounts).toHaveBeenCalledWith(mockPosts);
  });

  it('should have correct metadata', async () => {
    // This test verifies metadata export
    const { metadata } = await import('./page');
    expect(metadata.title).toBe('Ratings');
    expect(metadata.description).toContain('music ratings');
  });

  it('should have proper layout structure with divide class', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (tagUtilsModule.getTagCounts as jest.Mock).mockReturnValue([]);

    const { container } = render(await RatingsPage());

    const divider = container.querySelector('.divide-y');
    expect(divider).toBeInTheDocument();
  });
});
