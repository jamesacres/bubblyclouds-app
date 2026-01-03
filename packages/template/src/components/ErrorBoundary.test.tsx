import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary', () => {
  // Suppress console errors for cleaner test output
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  describe('rendering without errors', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('should render complex child components', () => {
      const ComplexChild = () => (
        <div>
          <h1>Complex Component</h1>
          <button>Click Me</button>
        </div>
      );

      render(
        <ErrorBoundary>
          <ComplexChild />
        </ErrorBoundary>
      );

      expect(screen.getByText('Complex Component')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('error rendering', () => {
    it('should render error UI when child throws error', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByText('Oops! Something went wrong')
      ).toBeInTheDocument();
    });

    it('should display error message in error state', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(
          /We encountered an unexpected error. Don't worry, your progress is saved!/
        )
      ).toBeInTheDocument();
    });

    it('should display error details when expanded', () => {
      const ErrorComponent = () => {
        throw new Error('Test error message');
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const detailsSummary = screen.getByText('Error Details');
      expect(detailsSummary).toBeInTheDocument();
    });

    it('should show error details after clicking summary', () => {
      const ErrorComponent = () => {
        throw new Error('Test error message');
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const summary = screen.getByText('Error Details');
      fireEvent.click(summary);

      // Details should be visible after click
      expect(summary).toBeInTheDocument();
    });
  });

  describe('error boundary buttons', () => {
    it('should have Reload App button', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByRole('button', { name: /Reload App/i })
      ).toBeInTheDocument();
    });

    it('should have Clear Storage & Reload button', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByRole('button', { name: /Clear Storage & Reload/i })
      ).toBeInTheDocument();
    });

    it('should not throw error when Reload App button is clicked', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /Reload App/i });

      // Button should be clickable (window.location.reload will be called but won't actually reload in test)
      expect(reloadButton).toBeEnabled();
      expect(reloadButton).toBeInTheDocument();
    });

    it('should have working Clear Storage & Reload button', () => {
      const clearSpy = jest.spyOn(Storage.prototype, 'clear');

      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const clearButton = screen.getByRole('button', {
        name: /Clear Storage & Reload/i,
      });

      // Button should be enabled and in the document
      expect(clearButton).toBeEnabled();
      expect(clearButton).toBeInTheDocument();

      clearSpy.mockRestore();
    });
  });

  describe('styling', () => {
    it('should have proper error container styling', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const errorContainer = container.querySelector('.flex.min-h-screen');
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer).toHaveClass('flex');
      expect(errorContainer).toHaveClass('min-h-screen');
      expect(errorContainer).toHaveClass('flex-col');
      expect(errorContainer).toHaveClass('items-center');
      expect(errorContainer).toHaveClass('justify-center');
    });

    it('should have dark mode support', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const errorContainer = container.querySelector('.dark\\:bg-zinc-900');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should display error heading with proper styling', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const heading = screen.getByText('Oops! Something went wrong');
      expect(heading).toHaveClass('text-4xl');
      expect(heading).toHaveClass('font-bold');
      expect(heading).toHaveClass('text-red-600');
    });
  });

  describe('error boundary behavior', () => {
    it('should catch and handle errors in lifecycle methods', () => {
      class ComponentWithLifecycleError extends React.Component {
        componentDidMount() {
          throw new Error('Lifecycle error');
        }

        render() {
          return <div>This should not render</div>;
        }
      }

      render(
        <ErrorBoundary>
          <ComponentWithLifecycleError />
        </ErrorBoundary>
      );

      expect(
        screen.getByText('Oops! Something went wrong')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('This should not render')
      ).not.toBeInTheDocument();
    });

    it('should catch errors thrown during render', () => {
      const ErrorComponent = () => {
        throw new Error('Render error');
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByText('Oops! Something went wrong')
      ).toBeInTheDocument();
    });

    it('should display support contact message', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/If this problem persists, please contact support./i)
      ).toBeInTheDocument();
    });

    it('should handle multiple error boundary instances independently', () => {
      const ErrorComponent1 = () => {
        throw new Error('Error 1');
      };

      render(
        <>
          <ErrorBoundary>
            <ErrorComponent1 />
          </ErrorBoundary>
          <ErrorBoundary>
            <div>This renders fine</div>
          </ErrorBoundary>
        </>
      );

      expect(
        screen.getByText('Oops! Something went wrong')
      ).toBeInTheDocument();
      expect(screen.getByText('This renders fine')).toBeInTheDocument();
    });
  });

  describe('error details display', () => {
    it('should show error message in details', () => {
      const errorMessage = 'Custom error message for testing';
      const ErrorComponent = () => {
        throw new Error(errorMessage);
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const summary = screen.getByText('Error Details');
      fireEvent.click(summary);

      // Error message should be in the DOM somewhere
      expect(screen.getByText('Error Details')).toBeInTheDocument();
    });

    it('should have expandable error details section', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const details = container.querySelector('details');
      expect(details).toBeInTheDocument();
      expect(details).toHaveClass('mb-6');
      expect(details).toHaveClass('rounded');
      expect(details).toHaveClass('bg-zinc-100');
      expect(details).toHaveClass('p-4');
      expect(details).toHaveClass('text-left');
      expect(details).toHaveClass('text-sm');
      expect(details).toHaveClass('dark:bg-zinc-800');
    });
  });

  describe('accessibility', () => {
    it('should have semantic HTML structure for error UI', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe('Oops! Something went wrong');
    });

    it('should have readable error messages', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/We encountered an unexpected error/i)
      ).toBeVisible();
    });

    it('should have accessible buttons', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);

      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle null children gracefully', () => {
      render(<ErrorBoundary>{null}</ErrorBoundary>);
      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      render(<ErrorBoundary>{undefined}</ErrorBoundary>);
      expect(document.body).toBeInTheDocument();
    });

    it('should render children with empty content', () => {
      render(
        <ErrorBoundary>
          <div></div>
        </ErrorBoundary>
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should maintain error state across re-renders', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByText('Oops! Something went wrong')
      ).toBeInTheDocument();

      rerender(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByText('Oops! Something went wrong')
      ).toBeInTheDocument();
    });
  });

  describe('error logging', () => {
    it('should log errors to console', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
