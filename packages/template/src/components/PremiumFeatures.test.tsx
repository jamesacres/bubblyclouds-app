import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PremiumFeatures } from './PremiumFeatures';
import {
  RevenueCatContextInterface,
  RevenueCatContext,
} from '../providers/RevenueCatProvider';

jest.mock('react-feather', () => ({
  Star: () => <div data-testid="star-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Watch: () => <div data-testid="watch-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Droplet: () => <div data-testid="droplet-icon" />,
  RotateCcw: () => <div data-testid="rotate-icon" />,
}));

const mockFeatures = [
  {
    icon: <div data-testid="calendar-icon" />,
    title: '🏁 Unlimited play and race',
    description: 'Race friends in real-time more than once a day',
  },
  {
    icon: <div data-testid="watch-icon" />,
    title: 'Create and join multiple racing teams',
    description: 'Host private competitions with friends and family',
  },
];

describe('PremiumFeatures', () => {
  const mockShowModal = jest.fn();

  const renderComponent = (
    props: Partial<React.ComponentProps<typeof PremiumFeatures>> = {},
    context: Partial<RevenueCatContextInterface> = {}
  ) => {
    const defaultContext: RevenueCatContextInterface = {
      isSubscribed: false,
      subscribeModal: { showModalIfRequired: mockShowModal } as any,
      refreshEntitlements: jest.fn(),
    } as unknown as RevenueCatContextInterface;

    return render(
      <RevenueCatContext.Provider
        value={
          {
            ...defaultContext,
            ...context,
          } as unknown as RevenueCatContextInterface
        }
      >
        <PremiumFeatures
          features={mockFeatures}
          title="🏁 Premium Features"
          subtitle="Unlock the full Sudoku Race experience"
          {...props}
        />
      </RevenueCatContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders default title and subtitle', () => {
    renderComponent();
    expect(screen.getByText(/🏁 Premium Features/)).toBeInTheDocument();
    expect(
      screen.getByText(/Unlock the full Sudoku Race experience/)
    ).toBeInTheDocument();
  });

  it('renders custom title and subtitle', () => {
    renderComponent({ title: 'Custom', subtitle: 'Sub' });
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('Sub')).toBeInTheDocument();
  });

  it('shows lock icons for non-subscribers', () => {
    renderComponent();
    expect(screen.getAllByTestId('lock-icon').length).toBeGreaterThan(0);
  });

  it('shows check icons for subscribers', () => {
    renderComponent({}, { isSubscribed: true });
    expect(screen.getAllByTestId('check-icon').length).toBeGreaterThan(0);
  });

  it('triggers subscription modal on click for non-subscribers', () => {
    const { container } = renderComponent();
    const feature = container.querySelector('.group');
    if (feature) {
      fireEvent.click(feature);
      expect(mockShowModal).toHaveBeenCalled();
    }
  });

  it('does not trigger modal for subscribers', () => {
    const { container } = renderComponent({}, { isSubscribed: true });
    const feature = container.querySelector('.group');
    if (feature) {
      fireEvent.click(feature);
      expect(mockShowModal).not.toHaveBeenCalled();
    }
  });

  it('renders compact view', () => {
    const { container } = renderComponent({ compact: true });
    // Check that component renders in compact mode
    expect(container.querySelector('.mb-4')).toBeInTheDocument();
  });
});
