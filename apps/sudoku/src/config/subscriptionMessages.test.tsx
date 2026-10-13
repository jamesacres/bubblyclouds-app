import React from 'react';
import { render, renderHook } from '@testing-library/react';
import { useSubscriptionContextMessages } from './subscriptionMessages';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';

describe('useSubscriptionContextMessages', () => {
  const getMessages = () =>
    renderHook(() => useSubscriptionContextMessages()).result.current;

  const expectedContexts: SubscriptionContext[] = [
    SubscriptionContext.UNDO,
    SubscriptionContext.CHECK_GRID,
    SubscriptionContext.REVEAL,
    SubscriptionContext.THEME_COLOR,
    SubscriptionContext.DAILY_PUZZLE_LIMIT,
    SubscriptionContext.COLLECTION_LOCKED,
    SubscriptionContext.REMOVE_MEMBER,
    SubscriptionContext.MULTIPLE_PARTIES,
    SubscriptionContext.PARTY_MAX_SIZE,
  ];

  it('defines a message for every applicable subscription context', () => {
    expectedContexts.forEach((context) => {
      expect(getMessages()[context]).toBeDefined();
    });
  });

  it('renders the daily limits with their localised wording', () => {
    const messages = getMessages();

    const { container: hint } = render(
      <>{messages[SubscriptionContext.HINT].content}</>
    );
    expect(hint.textContent).toBe(
      '💡 You’ve used your 2 free hints today. Plus gives you unlimited hints — never get stuck again — and keeps the whole app ad free.'
    );

    const { container: puzzle } = render(
      <>{messages[SubscriptionContext.DAILY_PUZZLE_LIMIT].content}</>
    );
    expect(puzzle.textContent).toBe(
      '🧩 You’ve reached your daily puzzle limit! Free users can play 1 puzzle per day. The limit resets tomorrow, or subscribe for unlimited puzzles.'
    );
  });

  it.each(expectedContexts)(
    'gives %s a background color, text color and renderable content',
    (context) => {
      const message = getMessages()[context];
      expect(message.bgColor).toEqual(expect.any(String));
      expect(message.textColor).toEqual(expect.any(String));

      const { container } = render(<>{message.content}</>);
      expect(container.textContent?.length).toBeGreaterThan(0);
    }
  );
});
