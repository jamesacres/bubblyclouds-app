import React from 'react';
import { render, renderHook } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { getSubscriptionContextMessages } from './subscriptionMessages';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';

const { result } = renderHook(() => useTranslation('app'));
const SUBSCRIPTION_CONTEXT_MESSAGES = getSubscriptionContextMessages(
  result.current.t
);

describe('getSubscriptionContextMessages', () => {
  const expectedContexts: (keyof typeof SUBSCRIPTION_CONTEXT_MESSAGES)[] = [
    SubscriptionContext.HINT,
    SubscriptionContext.UNDO,
    SubscriptionContext.COLLECTION_LOCKED,
    SubscriptionContext.THEME_COLOR,
    SubscriptionContext.REMOVE_MEMBER,
    SubscriptionContext.MULTIPLE_PARTIES,
    SubscriptionContext.PARTY_MAX_SIZE,
  ];

  it('defines a message for every applicable subscription context', () => {
    expectedContexts.forEach((context) => {
      expect(SUBSCRIPTION_CONTEXT_MESSAGES[context]).toBeDefined();
    });
  });

  it('interpolates the daily limits and never renders raw keys', () => {
    const { container } = render(
      <>
        {SUBSCRIPTION_CONTEXT_MESSAGES[SubscriptionContext.HINT].content}
        {SUBSCRIPTION_CONTEXT_MESSAGES[SubscriptionContext.UNDO].content}
      </>
    );
    expect(container.textContent).not.toContain('subscription.');
    expect(container.textContent).not.toContain('{{');
  });

  it.each(expectedContexts)(
    'gives %s a background color, text color and renderable content',
    (context) => {
      const message = SUBSCRIPTION_CONTEXT_MESSAGES[context];
      expect(message.bgColor).toEqual(expect.any(String));
      expect(message.textColor).toEqual(expect.any(String));

      const { container } = render(<>{message.content}</>);
      expect(container.textContent?.length).toBeGreaterThan(0);
    }
  );
});
