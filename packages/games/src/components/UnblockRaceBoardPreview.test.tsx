import { render } from '@testing-library/react';
import UnblockRaceBoardPreview from './UnblockRaceBoardPreview';

describe('UnblockRaceBoardPreview', () => {
  it('renders as a decorative, hidden-from-screen-reader element', () => {
    const { container } = render(<UnblockRaceBoardPreview />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders without crashing', () => {
    expect(() => render(<UnblockRaceBoardPreview />)).not.toThrow();
  });
});
