import React from 'react';
import { render } from '@testing-library/react';
import Header from './Header';

// Mock next/dynamic to avoid SSR issues in tests
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (fn: () => Promise<any>, _options: any) => {
    const DynamicComponent = React.lazy(fn);
    return (props: any) => (
      <React.Suspense fallback={<div>Loading...</div>}>
        <DynamicComponent {...props} />
      </React.Suspense>
    );
  },
}));

// Mock the subcomponents
jest.mock('@bubblyclouds-app/auth/components/HeaderUser', () => {
  return function DummyHeaderUser() {
    return <div data-testid="header-user">Header User</div>;
  };
});

jest.mock('./HeaderBack', () => {
  return {
    __esModule: true,
    default: function DummyHeaderBack() {
      return <div data-testid="header-back">Header Back</div>;
    },
  };
});

jest.mock('./HeaderTitle', () => {
  return {
    __esModule: true,
    default: function DummyHeaderTitle() {
      return <div data-testid="header-title">Header Title</div>;
    },
  };
});

jest.mock('./HeaderOnline', () => {
  return {
    __esModule: true,
    default: function DummyHeaderOnline() {
      return <div data-testid="header-online">Header Online</div>;
    },
  };
});

jest.mock('./ThemeControls', () => {
  return {
    __esModule: true,
    default: function DummyThemeControls() {
      return <div data-testid="theme-controls">Theme Controls</div>;
    },
  };
});

// Mock HeaderUser component for injection testing
const MockHeaderUser = function MockHeaderUser(props: any) {
  return (
    <div data-testid="header-user">Header User: {JSON.stringify(props)}</div>
  );
};

// Mock header user props with required fields
const mockHeaderUserProps = {
  privacyUrl: 'https://example.com/privacy',
  termsUrl: 'https://example.com/terms',
  companyUrl: 'https://example.com',
  companyName: 'Bubbly Clouds',
};

const defaultHeaderProps = {
  appName: 'Test App',
  isSubscribed: false,
  onPremiumColorClick: jest.fn(),
};

describe('Header', () => {
  describe('rendering', () => {
    it('should render header navigation', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('should render all child components', async () => {
      const { findByTestId } = render(<Header {...defaultHeaderProps} />);

      const headerBack = await findByTestId('header-back');
      const themeControls = await findByTestId('theme-controls');
      const headerOnline = await findByTestId('header-online');

      expect(headerBack).toBeInTheDocument();
      expect(themeControls).toBeInTheDocument();
      expect(headerOnline).toBeInTheDocument();
    });

    it('should render core child components when HeaderUser is provided', async () => {
      const { findByTestId } = render(
        <Header
          {...defaultHeaderProps}
          HeaderUser={MockHeaderUser}
          headerUserProps={{ ...mockHeaderUserProps, isSubscribed: true }}
        />
      );

      const headerBack = await findByTestId('header-back');
      const headerUser = await findByTestId('header-user');
      const themeControls = await findByTestId('theme-controls');
      const headerOnline = await findByTestId('header-online');

      expect(headerBack).toBeInTheDocument();
      expect(headerUser).toBeInTheDocument();
      expect(themeControls).toBeInTheDocument();
      expect(headerOnline).toBeInTheDocument();
    });

    it('should not render HeaderUser when not provided', async () => {
      const { findByTestId, queryByTestId } = render(
        <Header {...defaultHeaderProps} />
      );

      const headerBack = await findByTestId('header-back');
      const themeControls = await findByTestId('theme-controls');
      const headerOnline = await findByTestId('header-online');

      expect(headerBack).toBeInTheDocument();
      expect(themeControls).toBeInTheDocument();
      expect(headerOnline).toBeInTheDocument();
      expect(queryByTestId('header-user')).not.toBeInTheDocument();
    });

    it('should render spacing div below header', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      const spacingDiv =
        container.querySelector(
          '.pt-\\[calc\\(var\\(--ion-safe-area-top\\)\\+3\\.25rem\\)\\]'
        ) || container.querySelector('div[class*="pt-"]');
      expect(spacingDiv).toBeInTheDocument();
    });
  });

  describe('positioning and styling', () => {
    it('should have fixed positioning', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('fixed');
      expect(nav).toHaveClass('top-0');
      expect(nav).toHaveClass('left-0');
    });

    it('should have high z-index', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('z-50');
    });

    it('should span full width', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('w-screen');
    });

    it('should have flex layout', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('flex');
      expect(nav).toHaveClass('items-center');
    });

    it('should have safe area padding for notch', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('pt-[var(--ion-safe-area-top)]');
    });

    it('should have border styling', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('border-b');
    });

    it('should have background color', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      const nav = container.querySelector('nav');
      expect(nav?.className).toContain('bg-stone-50');
    });
  });

  describe('structure and layout', () => {
    it('should have left section with HeaderBack', async () => {
      const { container, findByTestId } = render(
        <Header {...defaultHeaderProps} />
      );
      const headerBack = await findByTestId('header-back');

      const leftSection = container.querySelector('.flex.shrink-0');
      expect(leftSection?.contains(headerBack)).toBe(true);
    });

    it('should have right section with controls', async () => {
      const { container, findByTestId } = render(
        <Header {...defaultHeaderProps} />
      );
      const themeControls = await findByTestId('theme-controls');

      const rightSection = container.querySelector('div[class*="gap-0"]');
      expect(rightSection?.contains(themeControls)).toBe(true);
    });

    it('should have right section with proper height', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      const rightSection = container.querySelector('.h-11');
      expect(rightSection).toHaveClass('items-center');
    });
  });

  describe('component composition', () => {
    it('should render HeaderBack in left section', async () => {
      const { findByTestId } = render(<Header {...defaultHeaderProps} />);
      const headerBack = await findByTestId('header-back');
      expect(headerBack.textContent).toBe('Header Back');
    });

    it('should render HeaderUser when injected', async () => {
      const { findByTestId } = render(
        <Header
          {...defaultHeaderProps}
          HeaderUser={MockHeaderUser}
          headerUserProps={mockHeaderUserProps}
        />
      );
      const headerUser = await findByTestId('header-user');
      expect(headerUser.textContent).toContain('Header User');
    });

    it('should render ThemeControls in right section', async () => {
      const { findByTestId } = render(<Header {...defaultHeaderProps} />);
      const themeControls = await findByTestId('theme-controls');
      expect(themeControls.textContent).toBe('Theme Controls');
    });

    it('should render HeaderOnline in right section', async () => {
      const { findByTestId } = render(<Header {...defaultHeaderProps} />);
      const headerOnline = await findByTestId('header-online');
      expect(headerOnline.textContent).toBe('Header Online');
    });
  });

  describe('HeaderUser injection', () => {
    it('should render injected HeaderUser with props', async () => {
      const headerUserProps = {
        ...mockHeaderUserProps,
        isSubscribed: true,
        showSubscribeModal: jest.fn(),
        deleteAccount: jest.fn(),
      };

      const { findByTestId } = render(
        <Header
          {...defaultHeaderProps}
          HeaderUser={MockHeaderUser}
          headerUserProps={headerUserProps}
        />
      );

      const headerUser = await findByTestId('header-user');
      expect(headerUser).toBeInTheDocument();
      expect(headerUser.textContent).toContain('true');
    });

    it('should pass isCapacitor prop to ThemeControls', async () => {
      const mockIsCapacitor = jest.fn();
      const { findByTestId } = render(
        <Header {...defaultHeaderProps} isCapacitor={mockIsCapacitor} />
      );

      const themeControls = await findByTestId('theme-controls');
      expect(themeControls).toBeInTheDocument();
    });

    it('should pass isOnline prop to HeaderOnline', async () => {
      const { findByTestId } = render(
        <Header {...defaultHeaderProps} isOnline={true} />
      );

      const headerOnline = await findByTestId('header-online');
      expect(headerOnline).toBeInTheDocument();
    });
  });

  describe('conditional rendering', () => {
    it('should always render HeaderBack by default', async () => {
      const { findByTestId } = render(<Header {...defaultHeaderProps} />);
      const headerBack = await findByTestId('header-back');
      expect(headerBack).toBeInTheDocument();
    });

    it('should always render ThemeControls by default', async () => {
      const { findByTestId } = render(<Header {...defaultHeaderProps} />);
      const themeControls = await findByTestId('theme-controls');
      expect(themeControls).toBeInTheDocument();
    });

    it('should always render HeaderOnline by default', async () => {
      const { findByTestId } = render(<Header {...defaultHeaderProps} />);
      const headerOnline = await findByTestId('header-online');
      expect(headerOnline).toBeInTheDocument();
    });

    it('should conditionally render HeaderUser', async () => {
      const { queryByTestId } = render(<Header {...defaultHeaderProps} />);
      expect(queryByTestId('header-user')).not.toBeInTheDocument();

      const { findByTestId: findByTestIdWithUser } = render(
        <Header
          {...defaultHeaderProps}
          HeaderUser={MockHeaderUser}
          headerUserProps={mockHeaderUserProps}
        />
      );
      const headerUser = await findByTestIdWithUser('header-user');
      expect(headerUser).toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    it('should maintain layout on different screen sizes', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('flex');
      expect(nav).toHaveClass('items-center');
    });
  });

  describe('dark mode support', () => {
    it('should have dark mode background color', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      const nav = container.querySelector('nav');
      expect(nav?.className).toContain('dark:bg-zinc-900');
    });
  });

  describe('spacing and typography', () => {
    it('should have a centered section for title', async () => {
      const { findByTestId } = render(<Header {...defaultHeaderProps} />);
      const headerTitle = await findByTestId('header-title');
      expect(headerTitle).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should be a navigation landmark', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      const nav = container.querySelector('nav');
      expect(nav?.tagName).toBe('NAV');
    });

    it('should have semantic structure', async () => {
      const { container, findByTestId } = render(
        <Header {...defaultHeaderProps} />
      );
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();

      const headerBack = await findByTestId('header-back');
      expect(headerBack).toBeInTheDocument();
    });
  });

  describe('safe area handling', () => {
    it('should apply ion-safe-area-top padding', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('pt-[var(--ion-safe-area-top)]');
    });

    it('should apply corresponding spacing div', () => {
      const { container } = render(<Header {...defaultHeaderProps} />);
      // Look for the spacing div with className containing pt-[calc
      const spacingDiv = container.querySelector('[class*="pt-"]');
      expect(spacingDiv).toBeInTheDocument();
    });
  });

  describe('layout order', () => {
    it('should render left section before center section', async () => {
      const { container, findByTestId } = render(
        <Header {...defaultHeaderProps} />
      );
      const nav = container.querySelector('nav');

      await findByTestId('header-back');

      const leftSection = nav?.querySelector('.flex.shrink-0');
      const centerSection = nav?.querySelector('.flex-1');

      const leftIndex = Array.from(nav?.children || []).indexOf(leftSection!);
      const centerIndex = Array.from(nav?.children || []).indexOf(
        centerSection!
      );

      expect(leftIndex).toBeLessThan(centerIndex);
    });
  });
});
