import React from 'react';
import { render, screen } from '@testing-library/react';
import PuzzlePage from './page';
import * as nextNavigation from 'next/navigation';
import { useWakeLock } from '@bubblyclouds-app/template/hooks/useWakeLock';

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@bubblyclouds-app/template/hooks/useWakeLock', () => ({
  useWakeLock: jest.fn(() => ({
    requestWakeLock: jest.fn(),
  })),
}));

jest.mock('@bubblyclouds-app/template/helpers/sha256', () => ({
  sha256: jest.fn((text) => Promise.resolve('mocked-hash-' + text)),
}));

describe('Puzzle Page', () => {
  const mockUseSearchParams = nextNavigation.useSearchParams as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  const renderComponent = () => render(<PuzzlePage />);

  it('should render without puzzle parameters', () => {
    renderComponent();
    expect(screen.queryByText(/TODO puzzle here/)).not.toBeInTheDocument();
  });

  it('should request wake lock when puzzle parameters are provided', async () => {
    const mockRequestWakeLock = jest.fn();
    (useWakeLock as jest.Mock).mockReturnValue({
      requestWakeLock: mockRequestWakeLock,
    });

    const params = new URLSearchParams();
    params.set('initial', '1');
    params.set('final', '2');
    mockUseSearchParams.mockReturnValue(params);

    renderComponent();

    expect(await screen.findByText(/TODO puzzle here/)).toBeInTheDocument();
    expect(mockRequestWakeLock).toHaveBeenCalled();
  });
});
