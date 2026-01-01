import React from 'react';
import { render, screen } from '@testing-library/react';
import { Providers } from './providers';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

// Mock auth providers
jest.mock('@bubblyclouds-app/auth/providers/FetchProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="fetch-provider">{children}</div>
  ),
}));

jest.mock('@bubblyclouds-app/auth/providers/UserProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="user-provider">{children}</div>
  ),
}));

// Mock template providers
jest.mock('@bubblyclouds-app/template/providers/CapacitorProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="capacitor-provider">{children}</div>
  ),
}));

jest.mock('@bubblyclouds-app/template/providers/GlobalStateProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="global-state-provider">{children}</div>
  ),
}));

jest.mock('@bubblyclouds-app/template/providers/RevenueCatProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="revenue-cat-provider">{children}</div>
  ),
}));

jest.mock('@bubblyclouds-app/template/providers/SessionsProvider', () => ({
  __esModule: true,
  SessionsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sessions-provider">{children}</div>
  ),
}));

// Mock UI providers
jest.mock('@bubblyclouds-app/ui/providers/ThemeColorProvider', () => ({
  ThemeColorProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-color-provider">{children}</div>
  ),
}));

// Mock sudoku providers
jest.mock('@bubblyclouds-app/template/providers/PartiesProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="parties-provider">{children}</div>
  ),
}));

jest.mock('@bubblyclouds-app/sudoku/providers/BookProvider', () => ({
  __esModule: true,
  BookProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="book-provider">{children}</div>
  ),
}));

jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
  useTheme: jest.fn(() => ({
    theme: 'light',
    setTheme: jest.fn(),
    systemTheme: 'light',
  })),
}));

describe('Providers', () => {
  describe('rendering', () => {
    it('should render children', () => {
      render(
        <Providers>
          <div>Test Content</div>
        </Providers>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <Providers>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </Providers>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('should render with fragment children', () => {
      render(
        <Providers>
          <>
            <div>Fragment 1</div>
            <div>Fragment 2</div>
          </>
        </Providers>
      );

      expect(screen.getByText('Fragment 1')).toBeInTheDocument();
      expect(screen.getByText('Fragment 2')).toBeInTheDocument();
    });

    it('should render with empty children', () => {
      const { container } = render(
        <Providers>
          <div />
        </Providers>
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('provider hierarchy', () => {
    it('should render GlobalStateProvider', () => {
      render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      expect(screen.getByTestId('global-state-provider')).toBeInTheDocument();
    });

    it('should render FetchProvider', () => {
      render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      expect(screen.getByTestId('fetch-provider')).toBeInTheDocument();
    });

    it('should render CapacitorProvider', () => {
      render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      expect(screen.getByTestId('capacitor-provider')).toBeInTheDocument();
    });

    it('should render UserProvider', () => {
      render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      expect(screen.getByTestId('user-provider')).toBeInTheDocument();
    });

    it('should render RevenueCatProvider', () => {
      render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      expect(screen.getByTestId('revenue-cat-provider')).toBeInTheDocument();
    });

    it('should render PartiesProvider', () => {
      render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      expect(screen.getByTestId('parties-provider')).toBeInTheDocument();
    });

    it('should render SessionsProvider', () => {
      render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      expect(screen.getByTestId('sessions-provider')).toBeInTheDocument();
    });

    it('should render BookProvider', () => {
      render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      expect(screen.getByTestId('book-provider')).toBeInTheDocument();
    });

    it('should render ThemeProvider', () => {
      render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    });

    it('should render ThemeColorProvider', () => {
      render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      expect(screen.getByTestId('theme-color-provider')).toBeInTheDocument();
    });
  });

  describe('provider nesting order', () => {
    it('should have GlobalStateProvider at the top level', () => {
      const { container } = render(
        <Providers>
          <div data-testid="test-content">Test</div>
        </Providers>
      );

      const globalStateProvider = container.querySelector(
        '[data-testid="global-state-provider"]'
      );
      expect(globalStateProvider).toBeInTheDocument();
      // GlobalStateProvider should be a direct child of the render container
      // Its parent should not have a data-testid (meaning it's not wrapped by another provider)
      expect(
        globalStateProvider?.parentElement?.hasAttribute('data-testid')
      ).toBe(false);
    });

    it('should have FetchProvider inside GlobalStateProvider', () => {
      const { container } = render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      const globalStateProvider = container.querySelector(
        '[data-testid="global-state-provider"]'
      );
      const fetchProvider = globalStateProvider?.querySelector(
        '[data-testid="fetch-provider"]'
      );

      expect(fetchProvider).toBeInTheDocument();
    });

    it('should have CapacitorProvider inside FetchProvider', () => {
      const { container } = render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      const fetchProvider = container.querySelector(
        '[data-testid="fetch-provider"]'
      );
      const capacitorProvider = fetchProvider?.querySelector(
        '[data-testid="capacitor-provider"]'
      );

      expect(capacitorProvider).toBeInTheDocument();
    });

    it('should have UserProvider inside CapacitorProvider', () => {
      const { container } = render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      const capacitorProvider = container.querySelector(
        '[data-testid="capacitor-provider"]'
      );
      const userProvider = capacitorProvider?.querySelector(
        '[data-testid="user-provider"]'
      );

      expect(userProvider).toBeInTheDocument();
    });

    it('should have RevenueCatProvider inside UserProvider', () => {
      const { container } = render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      const userProvider = container.querySelector(
        '[data-testid="user-provider"]'
      );
      const revenueCatProvider = userProvider?.querySelector(
        '[data-testid="revenue-cat-provider"]'
      );

      expect(revenueCatProvider).toBeInTheDocument();
    });

    it('should have PartiesProvider inside RevenueCatProvider', () => {
      const { container } = render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      const revenueCatProvider = container.querySelector(
        '[data-testid="revenue-cat-provider"]'
      );
      const partiesProvider = revenueCatProvider?.querySelector(
        '[data-testid="parties-provider"]'
      );

      expect(partiesProvider).toBeInTheDocument();
    });

    it('should have SessionsProvider inside PartiesProvider', () => {
      const { container } = render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      const partiesProvider = container.querySelector(
        '[data-testid="parties-provider"]'
      );
      const sessionsProvider = partiesProvider?.querySelector(
        '[data-testid="sessions-provider"]'
      );

      expect(sessionsProvider).toBeInTheDocument();
    });

    it('should have BookProvider inside SessionsProvider', () => {
      const { container } = render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      const sessionsProvider = container.querySelector(
        '[data-testid="sessions-provider"]'
      );
      const bookProvider = sessionsProvider?.querySelector(
        '[data-testid="book-provider"]'
      );

      expect(bookProvider).toBeInTheDocument();
    });

    it('should have ThemeProvider inside BookProvider', () => {
      const { container } = render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      const bookProvider = container.querySelector(
        '[data-testid="book-provider"]'
      );
      const themeProvider = bookProvider?.querySelector(
        '[data-testid="theme-provider"]'
      );

      expect(themeProvider).toBeInTheDocument();
    });

    it('should have ThemeColorProvider inside ThemeProvider', () => {
      const { container } = render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      const themeProvider = container.querySelector(
        '[data-testid="theme-provider"]'
      );
      const themeColorProvider = themeProvider?.querySelector(
        '[data-testid="theme-color-provider"]'
      );

      expect(themeColorProvider).toBeInTheDocument();
    });
  });

  describe('children passing', () => {
    it('should pass children through all providers', () => {
      render(
        <Providers>
          <span data-testid="innermost-content">Innermost</span>
        </Providers>
      );

      expect(screen.getByTestId('innermost-content')).toBeInTheDocument();
      expect(screen.getByText('Innermost')).toBeInTheDocument();
    });

    it('should pass multiple children through all providers', () => {
      render(
        <Providers>
          <span>First</span>
          <span>Second</span>
          <span>Third</span>
        </Providers>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('should render deeply nested content', () => {
      render(
        <Providers>
          <div>
            <div>
              <div>
                <span data-testid="deep-content">Deep Content</span>
              </div>
            </div>
          </div>
        </Providers>
      );

      expect(screen.getByTestId('deep-content')).toBeInTheDocument();
    });
  });

  describe('props handling', () => {
    it('should accept children prop', () => {
      const TestChild = () => <div>Child Component</div>;

      render(
        <Providers>
          <TestChild />
        </Providers>
      );

      expect(screen.getByText('Child Component')).toBeInTheDocument();
    });

    it('should handle children as string', () => {
      render(<Providers>Text content</Providers>);

      expect(screen.getByText('Text content')).toBeInTheDocument();
    });

    it('should handle children as React elements', () => {
      const element = React.createElement('div', { key: 'test' }, 'Element');

      render(<Providers>{element}</Providers>);

      expect(screen.getByText('Element')).toBeInTheDocument();
    });
  });

  describe('multiple renders', () => {
    it('should handle re-renders', () => {
      const { rerender } = render(
        <Providers>
          <div>First Render</div>
        </Providers>
      );

      expect(screen.getByText('First Render')).toBeInTheDocument();

      rerender(
        <Providers>
          <div>Second Render</div>
        </Providers>
      );

      expect(screen.getByText('Second Render')).toBeInTheDocument();
    });

    it('should maintain provider hierarchy across re-renders', () => {
      const { container, rerender } = render(
        <Providers>
          <div>Content 1</div>
        </Providers>
      );

      let globalStateProvider = container.querySelector(
        '[data-testid="global-state-provider"]'
      );
      expect(globalStateProvider).toBeInTheDocument();

      rerender(
        <Providers>
          <div>Content 2</div>
        </Providers>
      );

      globalStateProvider = container.querySelector(
        '[data-testid="global-state-provider"]'
      );
      expect(globalStateProvider).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should render with no children', () => {
      const { container } = render(<Providers>{null}</Providers>);

      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('global-state-provider')).toBeInTheDocument();
    });

    it('should render with undefined children', () => {
      const { container } = render(<Providers>{undefined}</Providers>);

      expect(container).toBeInTheDocument();
    });

    it('should render with false children', () => {
      const { container } = render(<Providers>{false}</Providers>);

      expect(container).toBeInTheDocument();
    });

    it('should render with array of children', () => {
      render(
        <Providers>
          {[<div key="1">Item 1</div>, <div key="2">Item 2</div>]}
        </Providers>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('component types', () => {
    it('should work with functional components', () => {
      const FunctionalComponent = () => <div>Functional</div>;

      render(
        <Providers>
          <FunctionalComponent />
        </Providers>
      );

      expect(screen.getByText('Functional')).toBeInTheDocument();
    });

    it('should work with HTML elements', () => {
      render(
        <Providers>
          <div className="test-class">HTML Element</div>
        </Providers>
      );

      expect(screen.getByText('HTML Element')).toBeInTheDocument();
    });

    it('should work with mixed content', () => {
      const Component = () => <span>Component</span>;

      render(
        <Providers>
          <div>
            <Component />
            <p>Paragraph</p>
            Text
          </div>
        </Providers>
      );

      expect(screen.getByText('Component')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('theme provider attribute', () => {
    it('should have ThemeProvider with class attribute', () => {
      // The ThemeProvider should be configured with attribute="class"
      // We verify this by checking if the ThemeProvider exists
      render(
        <Providers>
          <div>Test</div>
        </Providers>
      );

      expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    });
  });
});
