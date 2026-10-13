import React from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import UnblockRacePlusModal from './UnblockRacePlusModal';
import { getPremiumFeatures } from '../config/premiumFeatures';
import { getSubscriptionContextMessages } from '../config/subscriptionMessages';

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
    const { result } = renderHook(() => useTranslation('app'));
    render(<UnblockRacePlusModal />);
    expect(receivedProps?.features).toEqual(
      getPremiumFeatures(result.current.t)
    );
    expect(Object.keys(receivedProps?.contextMessages ?? {})).toEqual(
      Object.keys(getSubscriptionContextMessages(result.current.t))
    );
  });

  it('describes the Unblock Race Plus benefits', () => {
    render(<UnblockRacePlusModal />);
    const description = receivedProps?.description as React.ReactElement;
    const { container } = render(description);
    expect(container.textContent).toContain('Unblock Race Plus');
    expect(container.textContent).toContain('unlimited hints');
    expect(container.textContent).toContain('unlimited undos');
  });
});
