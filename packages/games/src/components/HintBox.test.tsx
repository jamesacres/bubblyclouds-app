import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HintBox } from './HintBox';

describe('HintBox', () => {
  describe('rendering', () => {
    it('should render hint box with content on initial render', () => {
      render(
        <HintBox>
          <span>Test hint content</span>
        </HintBox>
      );

      expect(screen.getByText('Test hint content')).toBeInTheDocument();
    });

    it('should render with amber background initially', () => {
      const { container } = render(
        <HintBox>
          <span>Hint text</span>
        </HintBox>
      );

      const hintDiv = container.querySelector('.bg-amber-100');
      expect(hintDiv).toBeInTheDocument();
    });

    it('should render with children content', () => {
      render(
        <HintBox>
          <div>Custom hint content</div>
        </HintBox>
      );

      expect(screen.getByText('Custom hint content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <HintBox>
          <span>Part 1</span>
          <span>Part 2</span>
        </HintBox>
      );

      expect(screen.getByText('Part 1')).toBeInTheDocument();
      expect(screen.getByText('Part 2')).toBeInTheDocument();
    });

    it('should render with close button', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const closeButton = container.querySelector('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render X icon in close button', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have correct styling classes', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const wrapper = container.querySelector('.mb-10');
      expect(wrapper).toHaveClass('text-center');
      expect(wrapper).toHaveClass('text-sm');
    });

    it('should have amber background styling', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const hintBox = container.querySelector('.bg-amber-100');
      expect(hintBox).toHaveClass('rounded-sm');
      expect(hintBox).toHaveClass('p-4');
      expect(hintBox).toHaveClass('pr-8');
      expect(hintBox).toHaveClass('text-black');
    });

    it('should have relative positioning for close button', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const hintBox = container.querySelector('.relative');
      expect(hintBox).toHaveClass('relative');
      expect(hintBox).toHaveClass('inline-block');
    });

    it('should have absolute positioned close button', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const closeButton = container.querySelector('button');
      expect(closeButton).toBeInTheDocument();

      const closeIcon = container.querySelector('svg');
      expect(closeIcon).toHaveClass('absolute');
      expect(closeIcon).toHaveClass('top-2');
      expect(closeIcon).toHaveClass('right-2');
    });
  });

  describe('close button functionality', () => {
    it('should hide hint box when close button is clicked', () => {
      const { container } = render(
        <HintBox>
          <span>Hint text</span>
        </HintBox>
      );

      const closeButton = container.querySelector('button');
      fireEvent.click(closeButton!);

      expect(screen.queryByText('Hint text')).not.toBeInTheDocument();
    });

    it('should hide hint box entirely after close', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const closeButton = container.querySelector('button');
      expect(closeButton).toBeInTheDocument();

      fireEvent.click(closeButton!);

      expect(container.querySelector('.bg-amber-100')).not.toBeInTheDocument();
    });

    it('should render empty fragment after closing', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const closeButton = container.querySelector('button');
      fireEvent.click(closeButton!);

      expect(container.textContent).toBe('');
    });

    it('should handle multiple close attempts gracefully', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const closeButton = container.querySelector('button');
      fireEvent.click(closeButton!);

      expect(screen.queryByText('Hint')).not.toBeInTheDocument();

      // Attempting to click again should not cause errors
      expect(() => {
        if (container.querySelector('button')) {
          fireEvent.click(container.querySelector('button')!);
        }
      }).not.toThrow();
    });
  });

  describe('state management', () => {
    it('should toggle hint visibility state', () => {
      const { container } = render(
        <HintBox>
          <span>Hint text</span>
        </HintBox>
      );

      // Initially shown
      expect(screen.getByText('Hint text')).toBeInTheDocument();

      // Close the hint
      const closeButton = container.querySelector('button');
      fireEvent.click(closeButton!);

      // Verify it's hidden
      expect(screen.queryByText('Hint text')).not.toBeInTheDocument();
    });

    it('should maintain closed state across re-renders', () => {
      const { container, rerender } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const closeButton = container.querySelector('button');
      fireEvent.click(closeButton!);

      expect(screen.queryByText('Hint')).not.toBeInTheDocument();

      rerender(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      // Should remain hidden even though we re-rendered with same content
      // This tests that state persists across re-renders
      expect(screen.queryByText('Hint')).not.toBeInTheDocument();
    });
  });

  describe('children content', () => {
    it('should render text children', () => {
      render(<HintBox>Text content</HintBox>);

      expect(screen.getByText('Text content')).toBeInTheDocument();
    });

    it('should render element children', () => {
      render(
        <HintBox>
          <strong>Bold text</strong>
        </HintBox>
      );

      expect(screen.getByText('Bold text')).toBeInTheDocument();
    });

    it('should render complex JSX children', () => {
      render(
        <HintBox>
          <div>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </div>
        </HintBox>
      );

      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    });

    it('should render children with event handlers', () => {
      const mockClick = jest.fn();
      render(
        <HintBox>
          <button onClick={mockClick}>Child Button</button>
        </HintBox>
      );

      const childButton = screen.getByRole('button', { name: 'Child Button' });
      fireEvent.click(childButton);

      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have close button accessible via keyboard', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const closeButton = container.querySelector('button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton?.tagName).toBe('BUTTON');
    });

    it('should support keyboard interaction on close button', () => {
      const { container } = render(
        <HintBox>
          <span>Hint text</span>
        </HintBox>
      );

      const closeButton = container.querySelector('button');
      fireEvent.keyDown(closeButton!, { key: 'Enter' });

      expect(screen.getByText('Hint text')).toBeInTheDocument();
    });

    it('should have readable text content', () => {
      render(<HintBox>Important hint message</HintBox>);

      expect(screen.getByText('Important hint message')).toBeVisible();
    });
  });

  describe('layout and positioning', () => {
    it('should be centered horizontally', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const wrapper = container.querySelector('.text-center');
      expect(wrapper).toHaveClass('text-center');
    });

    it('should have bottom margin', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const wrapper = container.querySelector('.mb-10');
      expect(wrapper).toHaveClass('mb-10');
    });

    it('should have inline-block for hint box', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const hintBox = container.querySelector('.inline-block');
      expect(hintBox).toHaveClass('inline-block');
    });
  });

  describe('icon rendering', () => {
    it('should render SVG icon for close button', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have close icon absolutely positioned', () => {
      const { container } = render(
        <HintBox>
          <span>Hint</span>
        </HintBox>
      );

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('absolute');
      expect(icon).toHaveClass('top-2');
      expect(icon).toHaveClass('right-2');
    });
  });

  describe('edge cases', () => {
    it('should handle empty children gracefully', () => {
      const { container } = render(<HintBox>{null}</HintBox>);

      expect(container.querySelector('.bg-amber-100')).toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      const { container } = render(<HintBox>{undefined}</HintBox>);

      expect(container.querySelector('.bg-amber-100')).toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longText = 'a'.repeat(500);
      render(<HintBox>{longText}</HintBox>);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      render(
        <HintBox>
          <span>&lt;Special&gt; &amp; Characters™</span>
        </HintBox>
      );

      expect(screen.getByText(/<Special> & Characters™/)).toBeInTheDocument();
    });
  });

  describe('integration', () => {
    it('should work with multiple instances independently', () => {
      const { container } = render(
        <>
          <HintBox>
            <span>Hint 1</span>
          </HintBox>
          <HintBox>
            <span>Hint 2</span>
          </HintBox>
        </>
      );

      expect(screen.getByText('Hint 1')).toBeInTheDocument();
      expect(screen.getByText('Hint 2')).toBeInTheDocument();

      const closeButtons = container.querySelectorAll('button');
      fireEvent.click(closeButtons[0]);

      expect(screen.queryByText('Hint 1')).not.toBeInTheDocument();
      expect(screen.getByText('Hint 2')).toBeInTheDocument();
    });
  });
});
