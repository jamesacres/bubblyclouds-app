import { render, screen } from '@testing-library/react';
import EntryDueCard from './EntryDueCard';

describe('EntryDueCard', () => {
  it('links to the entry screen for the month', () => {
    render(
      <EntryDueCard
        month="2026-07"
        doneNicknames={[]}
        outstandingNicknames={[]}
      />
    );
    expect(screen.getByTestId('entry-due-card')).toHaveAttribute(
      'href',
      '/state?month=2026-07'
    );
  });

  it('shows the month label and entry call to action', () => {
    render(
      <EntryDueCard
        month="2026-07"
        doneNicknames={[]}
        outstandingNicknames={[]}
      />
    );
    expect(screen.getByText('Jul 2026')).toBeInTheDocument();
    expect(screen.getByText('Enter balances')).toBeInTheDocument();
  });

  it('lists who is done and who is outstanding', () => {
    render(
      <EntryDueCard
        month="2026-07"
        doneNicknames={['James']}
        outstandingNicknames={['Alex', 'Sam']}
      />
    );
    expect(screen.getByText('Done: James')).toBeInTheDocument();
    expect(screen.getByText('Waiting on: Alex, Sam')).toBeInTheDocument();
  });

  it('omits the done and outstanding rows when empty', () => {
    render(
      <EntryDueCard
        month="2026-07"
        doneNicknames={[]}
        outstandingNicknames={[]}
      />
    );
    expect(screen.queryByText(/^Done:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Waiting on:/)).not.toBeInTheDocument();
  });
});
