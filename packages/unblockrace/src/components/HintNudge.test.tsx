import { render, screen } from '@testing-library/react';
import HintNudge from './HintNudge';

describe('HintNudge', () => {
  it('renders the stuck-try-a-hint speech bubble', () => {
    render(<HintNudge />);
    expect(screen.getByTestId('hint-nudge')).toBeInTheDocument();
    expect(screen.getByText('Stuck? Try a hint')).toBeInTheDocument();
  });
});
