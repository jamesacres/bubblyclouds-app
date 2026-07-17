import React from 'react';
import { render, screen } from '@testing-library/react';
import MyStatesTab from './MyStatesTab';
import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';
import { MoneyBagsState } from '../types/state';

const buildSession = (
  sessionId: string,
  updatedAt: Date
): ServerStateResult<MoneyBagsState> => ({
  sessionId,
  updatedAt,
  state: { answerStack: [], initial: {}, final: {}, data: {} },
});

describe('MyStatesTab', () => {
  it('shows an empty state when there are no sessions', () => {
    render(<MyStatesTab sessions={[]} app="moneybagsrace" />);
    expect(screen.getByText('No saved states yet')).toBeInTheDocument();
  });

  it('renders a link for each session labelled by month', () => {
    render(
      <MyStatesTab
        sessions={[
          buildSession('moneybagsrace-2026-07', new Date('2026-07-10')),
          buildSession('moneybagsrace-2026-06', new Date('2026-06-05')),
        ]}
        app="moneybagsrace"
      />
    );

    expect(screen.getByText('July 2026')).toBeInTheDocument();
    expect(screen.getByText('June 2026')).toBeInTheDocument();
  });

  it('links to the state page for the correct month', () => {
    render(
      <MyStatesTab
        sessions={[buildSession('moneybagsrace-2026-07', new Date())]}
        app="moneybagsrace"
      />
    );

    const link = screen.getByText('July 2026').closest('a');
    expect(link).toHaveAttribute('href', '/state?month=2026-07');
  });

  it('sorts sessions newest first', () => {
    render(
      <MyStatesTab
        sessions={[
          buildSession('moneybagsrace-2026-01', new Date('2026-01-01')),
          buildSession('moneybagsrace-2026-07', new Date('2026-07-01')),
        ]}
        app="moneybagsrace"
      />
    );

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveTextContent('July 2026');
    expect(links[1]).toHaveTextContent('January 2026');
  });
});
