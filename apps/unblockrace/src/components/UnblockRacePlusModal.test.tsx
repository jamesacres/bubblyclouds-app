import React from 'react';
import { render, screen } from '@testing-library/react';
import UnblockRacePlusModal from './UnblockRacePlusModal';
import { PREMIUM_FEATURES } from '../config/premiumFeatures';
import { SUBSCRIPTION_CONTEXT_MESSAGES } from '../config/subscriptionMessages';

let receivedProps: Record<string, unknown> | undefined;

jest.mock('@bubblyclouds-app/template/components/PlusModal', () => {
  return function MockPlusModal(props: Record<string, unknown>) {
    receivedProps = props;
    return <div data-testid="plus-modal" />;
  };
});

describe('UnblockRacePlusModal', () => {
  beforeEach(() => {
    receivedProps = undefined;
  });

  it('renders the shared PlusModal', () => {
    render(<UnblockRacePlusModal />);
    expect(screen.getByTestId('plus-modal')).toBeInTheDocument();
  });

  it('passes the premium features and subscription context messages', () => {
    render(<UnblockRacePlusModal />);
    expect(receivedProps?.features).toBe(PREMIUM_FEATURES);
    expect(receivedProps?.contextMessages).toBe(SUBSCRIPTION_CONTEXT_MESSAGES);
  });

  it('describes the Unblock Race Plus benefits', () => {
    render(<UnblockRacePlusModal />);
    const description = receivedProps?.description as React.ReactElement;
    const { container } = render(description);
    expect(container.textContent).toContain('unlimited hints');
    expect(container.textContent).toContain('unlimited undos');
  });
});
