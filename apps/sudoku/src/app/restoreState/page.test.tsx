import React from 'react';
import { render } from '@testing-library/react';
import Home from './page';
import { UserContext } from '@sudoku-web/auth/providers/AuthProvider';

// Mock next/image as it may be used
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} />;
  },
}));

describe('RestoreState Page', () => {
  const mockHandleRestoreState = jest.fn();
  const mockUserContext = {
    isInitialised: true,
    handleRestoreState: mockHandleRestoreState,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear electronAPI from window
    delete (window as any).electronAPI;
  });

  afterEach(() => {
    delete (window as any).electronAPI;
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <Home />
        </UserContext.Provider>
      );
    });

    it('should render an empty main element', () => {
      const { container } = render(
        <UserContext.Provider value={mockUserContext as any}>
          <Home />
        </UserContext.Provider>
      );

      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('should render without children in main element', () => {
      const { container } = render(
        <UserContext.Provider value={mockUserContext as any}>
          <Home />
        </UserContext.Provider>
      );

      const main = container.querySelector('main');
      expect(main?.children.length).toBe(0);
    });
  });

  describe('Restore State Logic', () => {
    it('should call handleRestoreState when electronAPI is available and isInitialised is true', () => {
      (window as any).electronAPI = {};

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <Home />
        </UserContext.Provider>
      );

      expect(mockHandleRestoreState).toHaveBeenCalled();
    });

    it('should not call handleRestoreState when electronAPI is not available', () => {
      mockHandleRestoreState.mockClear();

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <Home />
        </UserContext.Provider>
      );

      expect(mockHandleRestoreState).not.toHaveBeenCalled();
    });

    it('should not call handleRestoreState when isInitialised is false', () => {
      (window as any).electronAPI = {};
      const contextNotInitialised = {
        ...mockUserContext,
        isInitialised: false,
      };

      render(
        <UserContext.Provider value={contextNotInitialised as any}>
          <Home />
        </UserContext.Provider>
      );

      expect(mockHandleRestoreState).not.toHaveBeenCalled();
    });

    it('should not call handleRestoreState when handleRestoreState is undefined', () => {
      (window as any).electronAPI = {};
      const contextNoHandler = {
        ...mockUserContext,
        handleRestoreState: undefined,
      };

      render(
        <UserContext.Provider value={contextNoHandler as any}>
          <Home />
        </UserContext.Provider>
      );

      expect(mockHandleRestoreState).not.toHaveBeenCalled();
    });

    it('should not call handleRestoreState when UserContext is undefined', () => {
      (window as any).electronAPI = {};
      mockHandleRestoreState.mockClear();

      render(<Home />);

      expect(mockHandleRestoreState).not.toHaveBeenCalled();
    });
  });

  describe('Dependency Array', () => {
    it('should call handleRestoreState when isInitialised changes to true', () => {
      (window as any).electronAPI = {};
      const contextNotInitialised = {
        ...mockUserContext,
        isInitialised: false,
      };

      const { rerender } = render(
        <UserContext.Provider value={contextNotInitialised as any}>
          <Home />
        </UserContext.Provider>
      );

      expect(mockHandleRestoreState).not.toHaveBeenCalled();

      // Update context to isInitialised: true
      rerender(
        <UserContext.Provider value={mockUserContext as any}>
          <Home />
        </UserContext.Provider>
      );

      expect(mockHandleRestoreState).toHaveBeenCalled();
    });

    it('should call handleRestoreState when handleRestoreState function changes', () => {
      (window as any).electronAPI = {};
      mockHandleRestoreState.mockClear();

      const firstHandler = jest.fn();
      const firstContext = {
        ...mockUserContext,
        handleRestoreState: firstHandler,
      };

      const { rerender } = render(
        <UserContext.Provider value={firstContext as any}>
          <Home />
        </UserContext.Provider>
      );

      expect(firstHandler).toHaveBeenCalledTimes(1);

      // Change handler
      const secondHandler = jest.fn();
      const secondContext = {
        ...mockUserContext,
        handleRestoreState: secondHandler,
      };

      rerender(
        <UserContext.Provider value={secondContext as any}>
          <Home />
        </UserContext.Provider>
      );

      expect(secondHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle when electronAPI is an empty object', () => {
      (window as any).electronAPI = {};

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <Home />
        </UserContext.Provider>
      );

      expect(mockHandleRestoreState).toHaveBeenCalled();
    });

    it('should handle when electronAPI has properties', () => {
      (window as any).electronAPI = {
        someMethod: jest.fn(),
        someProperty: 'value',
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <Home />
        </UserContext.Provider>
      );

      expect(mockHandleRestoreState).toHaveBeenCalled();
    });

    it('should handle when context values are null', () => {
      const nullContext = {
        isInitialised: null,
        handleRestoreState: null,
      };

      render(
        <UserContext.Provider value={nullContext as any}>
          <Home />
        </UserContext.Provider>
      );

      expect(mockHandleRestoreState).not.toHaveBeenCalled();
    });

    it('should be safe to call multiple times', () => {
      (window as any).electronAPI = {};

      const { rerender } = render(
        <UserContext.Provider value={mockUserContext as any}>
          <Home />
        </UserContext.Provider>
      );

      expect(mockHandleRestoreState).toHaveBeenCalledTimes(1);

      // Rerender with same props
      rerender(
        <UserContext.Provider value={mockUserContext as any}>
          <Home />
        </UserContext.Provider>
      );

      // Should have been called again due to dependency change
      expect(mockHandleRestoreState).toHaveBeenCalled();
    });
  });

  describe('Context Availability', () => {
    it('should handle when UserContext provider is missing', () => {
      (window as any).electronAPI = {};

      // Should not crash even without provider
      const { container } = render(<Home />);
      expect(container).toBeTruthy();
    });

    it('should use default value when context not provided', () => {
      (window as any).electronAPI = {};

      const { container } = render(<Home />);
      const main = container.querySelector('main');

      expect(main).toBeInTheDocument();
    });
  });

  describe('Main Element', () => {
    it('should render main element with correct tag', () => {
      const { container } = render(
        <UserContext.Provider value={mockUserContext as any}>
          <Home />
        </UserContext.Provider>
      );

      const main = container.querySelector('main');
      expect(main?.tagName).toBe('MAIN');
    });

    it('should render only one main element', () => {
      const { container } = render(
        <UserContext.Provider value={mockUserContext as any}>
          <Home />
        </UserContext.Provider>
      );

      const mains = container.querySelectorAll('main');
      expect(mains.length).toBe(1);
    });

    it('should render main element without props or classes', () => {
      const { container } = render(
        <UserContext.Provider value={mockUserContext as any}>
          <Home />
        </UserContext.Provider>
      );

      const main = container.querySelector('main');
      expect(main?.className).toBe('');
      expect(main?.getAttribute('id')).toBeNull();
    });
  });
});
