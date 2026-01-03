import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Testers from './page';
import { useRouter, useSearchParams } from 'next/navigation';
import * as capacitorHelper from '@bubblyclouds-app/template/helpers/capacitor';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@bubblyclouds-app/template/helpers/capacitor', () => ({
  isCapacitor: jest.fn(() => false),
}));

const mockUseRouter = useRouter as jest.Mock;
const mockUseSearchParams = useSearchParams as jest.Mock;
const mockIsCapacitor = capacitorHelper.isCapacitor as jest.Mock;

describe('Testers Page', () => {
  let mockRouter: { replace: jest.Mock; push: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter = {
      replace: jest.fn(),
      push: jest.fn(),
    };
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockIsCapacitor.mockReturnValue(false);
  });

  const renderComponent = () =>
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <Testers />
      </Suspense>
    );

  describe('Page Rendering', () => {
    it('should render without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should display main heading', () => {
      renderComponent();
      expect(screen.getByText(/🚀 Join the Sudoku Race!/i)).toBeInTheDocument();
    });
  });

  describe('Racing Team Invite Links', () => {
    it('should not show invite link when no inviteId', () => {
      renderComponent();
      // Check that there are no external invite links when no inviteId is present
      const externalLinks = screen.queryAllByRole('link');
      const inviteLinks = externalLinks.filter(
        (link) =>
          link
            .getAttribute('href')
            ?.includes('sudoku.bubblyclouds.com/invite') || false
      );
      expect(inviteLinks.length).toBe(0);
    });

    it('should show invite links when inviteId is present', () => {
      const searchParams = new URLSearchParams();
      searchParams.set('inviteId', 'test-invite-123');
      mockUseSearchParams.mockReturnValue(searchParams);

      renderComponent();

      const inviteLinks = screen.queryAllByRole('link');
      const externalInviteLinks = inviteLinks.filter(
        (link) =>
          link
            .getAttribute('href')
            ?.includes(
              'sudoku.bubblyclouds.com/invite?inviteId=test-invite-123'
            ) || false
      );
      expect(externalInviteLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Capacitor Redirect Logic', () => {
    it('should redirect to invite page when on Capacitor', async () => {
      mockIsCapacitor.mockReturnValue(true);
      const searchParams = new URLSearchParams();
      searchParams.set('inviteId', 'test-invite-123');
      mockUseSearchParams.mockReturnValue(searchParams);

      renderComponent();

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith(
          '/invite?inviteId=test-invite-123'
        );
      });
    });

    it('should not redirect when not on Capacitor', () => {
      renderComponent();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });
});
