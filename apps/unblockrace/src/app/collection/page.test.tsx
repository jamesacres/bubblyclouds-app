import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CollectionPage from './page';
import * as nextNavigation from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Collection Page', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (nextNavigation.useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('should render the monthly collection heading', () => {
    render(<CollectionPage />);
    expect(screen.getByText('Monthly collection')).toBeInTheDocument();
  });

  it('should navigate home when back button is clicked', () => {
    render(<CollectionPage />);
    fireEvent.click(screen.getByText('Back to home'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
