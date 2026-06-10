import React from 'react';
import { render, screen } from '@testing-library/react';
import { PuzzleHeader } from './PuzzleHeader';
import { BaseServerState } from '../../types/state';

const mockState: BaseServerState = {
  answerStack: [],
  initial: [],
  final: [],
};

const MockCompactState = ({ state: _state }: { state: BaseServerState }) => (
  <div data-testid="compact-state">Compact</div>
);

describe('PuzzleHeader', () => {
  it('returns null when no difficulty, title, or initialState', () => {
    const { container } = render(<PuzzleHeader />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when difficulty is provided', () => {
    const { container } = render(<PuzzleHeader difficulty="Easy" />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders when title is provided', () => {
    const { container } = render(<PuzzleHeader title="Puzzle #1" />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders when initialState is provided', () => {
    const { container } = render(
      <PuzzleHeader
        initialState={mockState}
        CompactSimpleState={MockCompactState}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the title text', () => {
    render(<PuzzleHeader title="Daily Puzzle" />);
    expect(screen.getByText('Daily Puzzle')).toBeInTheDocument();
  });

  it('renders the difficulty text', () => {
    render(<PuzzleHeader difficulty="Hard" />);
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('renders the metaLabel text', () => {
    render(<PuzzleHeader title="Puzzle" metaLabel="Today's challenge" />);
    expect(screen.getByText("Today's challenge")).toBeInTheDocument();
  });

  it('does not render metaLabel when not provided', () => {
    render(<PuzzleHeader title="Puzzle" />);
    expect(screen.queryByText("Today's challenge")).not.toBeInTheDocument();
  });

  it('renders the CompactSimpleState when initialState and component are provided', () => {
    render(
      <PuzzleHeader
        initialState={mockState}
        CompactSimpleState={MockCompactState}
      />
    );
    expect(screen.getByTestId('compact-state')).toBeInTheDocument();
  });

  it('does not render CompactSimpleState when initialState is missing', () => {
    render(
      <PuzzleHeader title="Puzzle" CompactSimpleState={MockCompactState} />
    );
    expect(screen.queryByTestId('compact-state')).not.toBeInTheDocument();
  });

  it('does not render CompactSimpleState when component is missing', () => {
    render(<PuzzleHeader title="Puzzle" initialState={mockState} />);
    expect(screen.queryByTestId('compact-state')).not.toBeInTheDocument();
  });

  it('applies a custom difficultyBadgeColor class', () => {
    const { container } = render(
      <PuzzleHeader difficulty="Medium" difficultyBadgeColor="bg-yellow-500" />
    );
    const badge = container.querySelector('.bg-yellow-500');
    expect(badge).toBeInTheDocument();
  });

  it('renders all provided fields together', () => {
    render(
      <PuzzleHeader
        difficulty="Expert"
        title="Grand Challenge"
        metaLabel="Weekly"
        initialState={mockState}
        CompactSimpleState={MockCompactState}
      />
    );
    expect(screen.getByText('Grand Challenge')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByTestId('compact-state')).toBeInTheDocument();
  });
});
