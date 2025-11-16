import React from 'react';
import { render, screen } from '@testing-library/react';
import { TimerDisplay } from './TimerDisplay';

// Mock the formatSeconds helper from template package
jest.mock('@sudoku-web/template', () => ({
  formatSeconds: (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  },
}));

describe('TimerDisplay', () => {
  describe('rendering', () => {
    it('should render a paragraph element', () => {
      const { container } = render(<TimerDisplay seconds={0} />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
    });

    it('should have min-h-8 class for minimum height', () => {
      const { container } = render(<TimerDisplay seconds={0} />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toHaveClass('min-h-8');
      expect(paragraph).toHaveClass('font-mono');
    });
  });

  describe('timer display mode', () => {
    it('should display watch icon and time when not complete', () => {
      const { container } = render(<TimerDisplay seconds={90} />);

      // Should contain the formatted time
      expect(screen.getByText(/1:30/)).toBeInTheDocument();

      // Should contain SVG icon (from react-feather Watch)
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should format seconds correctly', () => {
      render(<TimerDisplay seconds={65} />);

      expect(screen.getByText(/1:05/)).toBeInTheDocument();
    });

    it('should display zero seconds correctly', () => {
      render(<TimerDisplay seconds={0} />);

      expect(screen.getByText(/0:00/)).toBeInTheDocument();
    });

    it('should display large time values', () => {
      render(<TimerDisplay seconds={3661} />);

      // 3661 seconds = 1 hour, 1 minute, 1 second
      expect(screen.getByText(/1:01:01/)).toBeInTheDocument();
    });

    it('should have theme color for watch icon', () => {
      const { container } = render(<TimerDisplay seconds={90} />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-theme-primary');
      expect(svg).toHaveClass('dark:text-theme-primary-light');
    });

    it('should have watch icon with size 24', () => {
      const { container } = render(<TimerDisplay seconds={90} />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '24');
      expect(svg).toHaveAttribute('height', '24');
    });
  });

  describe('countdown mode', () => {
    it('should display "GO!" when countdown is 1', () => {
      render(<TimerDisplay seconds={90} countdown={1} />);

      expect(screen.getByText('GO!')).toBeInTheDocument();
    });

    it('should display countdown number minus 1', () => {
      render(<TimerDisplay seconds={90} countdown={3} />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should display countdown for different values', () => {
      render(<TimerDisplay seconds={90} countdown={5} />);

      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should display countdown for 2', () => {
      render(<TimerDisplay seconds={90} countdown={2} />);

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should not display watch icon in countdown mode', () => {
      const { container } = render(<TimerDisplay seconds={90} countdown={3} />);

      // In countdown mode, should not have SVG icon
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });

    it('should not display timer in countdown mode', () => {
      render(<TimerDisplay seconds={90} countdown={3} />);

      expect(screen.queryByText(/1:30/)).not.toBeInTheDocument();
    });
  });

  describe('completion mode', () => {
    it('should display time with celebration emoji when isComplete is true', () => {
      const { container } = render(
        <TimerDisplay seconds={90} isComplete={true} />
      );

      // Should show celebration emoji and formatted time
      const text = container.querySelector('p')?.textContent || '';
      expect(text).toContain('👏');
      expect(text).toContain('1:30');
    });

    it('should not display watch icon in completion mode', () => {
      const { container } = render(
        <TimerDisplay seconds={90} isComplete={true} />
      );

      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });

    it('should display formatted completion time', () => {
      const { container } = render(
        <TimerDisplay seconds={3661} isComplete={true} />
      );

      const text = container.querySelector('p')?.textContent || '';
      expect(text).toContain('👏');
      expect(text).toContain('1:01:01');
    });

    it('should display celebration emoji', () => {
      const { container } = render(
        <TimerDisplay seconds={90} isComplete={true} />
      );

      const text = container.querySelector('p')?.textContent;
      expect(text).toContain('👏');
    });
  });

  describe('prop priority', () => {
    it('should prioritize isComplete over countdown', () => {
      render(<TimerDisplay seconds={90} isComplete={true} countdown={3} />);

      // Should show completion format, not countdown
      expect(screen.getByText(/👏/)).toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });

    it('should prioritize countdown over timer when both are missing isComplete', () => {
      render(<TimerDisplay seconds={90} countdown={3} />);

      // Should show countdown, not timer
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.queryByText(/1:30/)).not.toBeInTheDocument();
    });

    it('should show timer when no countdown and not complete', () => {
      render(<TimerDisplay seconds={90} />);

      // Should show timer
      expect(screen.getByText(/1:30/)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle zero seconds', () => {
      render(<TimerDisplay seconds={0} />);

      expect(screen.getByText(/0:00/)).toBeInTheDocument();
    });

    it('should handle large second values', () => {
      render(<TimerDisplay seconds={359999} />);

      // 359999 seconds = 99 hours, 59 minutes, 59 seconds
      expect(screen.getByText(/99:59:59/)).toBeInTheDocument();
    });

    it('should handle countdown of 1', () => {
      render(<TimerDisplay seconds={0} countdown={1} />);

      expect(screen.getByText('GO!')).toBeInTheDocument();
    });

    it('should handle countdown of 100', () => {
      render(<TimerDisplay seconds={0} countdown={100} />);

      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('should handle undefined countdown', () => {
      render(<TimerDisplay seconds={90} countdown={undefined} />);

      expect(screen.getByText(/1:30/)).toBeInTheDocument();
    });

    it('should handle undefined isComplete', () => {
      render(<TimerDisplay seconds={90} isComplete={undefined} />);

      expect(screen.getByText(/1:30/)).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have monospace font', () => {
      const { container } = render(<TimerDisplay seconds={90} />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toHaveClass('font-mono');
    });

    it('should have minimum height of 8 units', () => {
      const { container } = render(<TimerDisplay seconds={90} />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toHaveClass('min-h-8');
    });

    it('should maintain height consistency across modes', () => {
      const { container: container1 } = render(<TimerDisplay seconds={90} />);

      const { container: container2 } = render(
        <TimerDisplay seconds={90} countdown={3} />
      );

      const { container: container3 } = render(
        <TimerDisplay seconds={90} isComplete={true} />
      );

      expect(container1.querySelector('p')).toHaveClass('min-h-8');
      expect(container2.querySelector('p')).toHaveClass('min-h-8');
      expect(container3.querySelector('p')).toHaveClass('min-h-8');
    });
  });

  describe('timer transitions', () => {
    it('should transition from timer to completion', () => {
      const { rerender } = render(<TimerDisplay seconds={90} />);

      expect(screen.getByText(/1:30/)).toBeInTheDocument();

      rerender(<TimerDisplay seconds={90} isComplete={true} />);

      expect(screen.getByText(/👏/)).toBeInTheDocument();
    });

    it('should transition from timer to countdown', () => {
      const { rerender } = render(<TimerDisplay seconds={90} />);

      expect(screen.getByText(/1:30/)).toBeInTheDocument();

      rerender(<TimerDisplay seconds={90} countdown={3} />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should transition from countdown to GO!', () => {
      const { rerender } = render(<TimerDisplay seconds={90} countdown={5} />);

      expect(screen.getByText('4')).toBeInTheDocument();

      rerender(<TimerDisplay seconds={90} countdown={1} />);

      expect(screen.getByText('GO!')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have semantic paragraph element', () => {
      const { container } = render(<TimerDisplay seconds={90} />);

      const paragraph = container.querySelector('p');
      expect(paragraph?.tagName).toBe('P');
    });

    it('should display readable time format', () => {
      render(<TimerDisplay seconds={125} />);

      // 125 seconds = 2 minutes 5 seconds = 2:05
      expect(screen.getByText(/2:05/)).toBeInTheDocument();
    });

    it('should include readable text content in timer mode', () => {
      const { container } = render(<TimerDisplay seconds={90} />);

      const paragraph = container.querySelector('p');
      expect(paragraph?.textContent).toMatch(/1:30/);
    });
  });

  describe('text content variations', () => {
    it('should contain only formatted time in timer mode', () => {
      const { container } = render(<TimerDisplay seconds={125} />);

      const text = container.querySelector('p')?.textContent;
      expect(text).toContain('2:05');
    });

    it('should contain formatted number in countdown mode', () => {
      const { container } = render(<TimerDisplay seconds={0} countdown={5} />);

      const text = container.querySelector('p')?.textContent;
      expect(text).toContain('4');
    });

    it('should contain GO in completion countdown', () => {
      const { container } = render(<TimerDisplay seconds={0} countdown={1} />);

      const text = container.querySelector('p')?.textContent;
      expect(text).toContain('GO!');
    });

    it('should contain celebration emoji in completion mode', () => {
      const { container } = render(
        <TimerDisplay seconds={0} isComplete={true} />
      );

      const text = container.querySelector('p')?.textContent;
      expect(text).toContain('👏');
    });
  });
});
