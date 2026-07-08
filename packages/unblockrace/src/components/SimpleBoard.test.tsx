import { render } from '@testing-library/react';
import SimpleBoard from './SimpleBoard';

const INITIAL = [
  'oooooo',
  'oooooo',
  'AAoBoo',
  'oooBoo',
  'oooooo',
  'oooxoo',
].join('');

// A one step right
const LATEST = [
  'oooooo',
  'oooooo',
  'oAABoo',
  'oooBoo',
  'oooooo',
  'oooxoo',
].join('');

describe('SimpleBoard', () => {
  it('renders pieces and walls from an initial board', () => {
    const { container } = render(<SimpleBoard initial={INITIAL} />);
    // 2 pieces + 1 wall
    expect(container.firstChild?.childNodes).toHaveLength(3);
  });

  it('prefers the latest answer from a state', () => {
    const { container } = render(
      <SimpleBoard
        state={{
          initial: INITIAL,
          final: INITIAL,
          answerStack: [INITIAL, LATEST],
        }}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders nothing without a board', () => {
    const { container } = render(<SimpleBoard />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for an unparseable board', () => {
    const { container } = render(<SimpleBoard initial="garbage" />);
    expect(container.firstChild).toBeNull();
  });
});
