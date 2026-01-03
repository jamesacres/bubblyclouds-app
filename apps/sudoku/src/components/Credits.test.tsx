import { render, screen } from '@testing-library/react';
import { Credits } from './Credits';

describe('Credits', () => {
  it('renders without crashing', () => {
    render(<Credits />);
    expect(screen.getByText(/Credits & Attribution/i)).toBeInTheDocument();
  });

  it('displays all credit items', () => {
    render(<Credits />);

    expect(screen.getByText('QQwing')).toBeInTheDocument();
    expect(screen.getByText('Tdoku')).toBeInTheDocument();
    expect(screen.getByText('AR Browser Sudoku')).toBeInTheDocument();
    expect(screen.getByText('Sudoku Coach')).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument();
    expect(screen.getByText('Capacitor')).toBeInTheDocument();
    expect(screen.getByText('Electron')).toBeInTheDocument();
    expect(screen.getByText('TensorFlow.js')).toBeInTheDocument();
    expect(screen.getByText('RevenueCat')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Turborepo')).toBeInTheDocument();
  });

  it('shows descriptions for each credit', () => {
    render(<Credits />);

    expect(
      screen.getByText(/Sudoku of the Day puzzle generation/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Fast Sudoku solver for scanned puzzles/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Augmented reality scanner technology/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Inspiration for difficulty calculation/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/React framework for production/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Typed superset of JavaScript/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Utility-first CSS framework/i)
    ).toBeInTheDocument();
  });

  it('displays license information when available', () => {
    render(<Credits />);

    expect(screen.getByText('GPL-2.0')).toBeInTheDocument();
  });

  it('renders links as clickable elements', () => {
    render(<Credits />);

    const qqwingLinks = screen.getAllByRole('link', { name: /QQwing/i });
    expect(qqwingLinks[0]).toHaveAttribute(
      'href',
      'https://github.com/stephenostermiller/qqwing'
    );
    expect(qqwingLinks[0]).toHaveAttribute('target', '_blank');
    expect(qqwingLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('hides title when showTitle is false', () => {
    render(<Credits showTitle={false} />);

    expect(
      screen.queryByText(/Credits & Attribution/i)
    ).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Credits className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('displays footer with MIT license information', () => {
    render(<Credits />);

    expect(
      screen.getByText(/This app is licensed under the MIT License/i)
    ).toBeInTheDocument();
  });

  it('includes links to LICENSE and CREDITS.md', () => {
    render(<Credits />);

    const licenseLink = screen.getByRole('link', { name: /LICENSE/i });
    expect(licenseLink).toHaveAttribute(
      'href',
      'https://github.com/jamesacres/bubblyclouds-app/blob/main/LICENSE'
    );

    const creditsLink = screen.getByRole('link', { name: /CREDITS/i });
    expect(creditsLink).toHaveAttribute(
      'href',
      'https://github.com/jamesacres/bubblyclouds-app/blob/main/CREDITS.md'
    );
  });

  it('renders all credit URLs as links', () => {
    render(<Credits />);

    const urlLinks = screen.getAllByRole('link');
    expect(urlLinks.length).toBeGreaterThan(13);
  });
});
