import React from 'react';
import { render } from '@testing-library/react';
import { SUBSCRIPTION_CONTEXT_MESSAGES } from './subscriptionMessages';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';

describe('SUBSCRIPTION_CONTEXT_MESSAGES', () => {
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
