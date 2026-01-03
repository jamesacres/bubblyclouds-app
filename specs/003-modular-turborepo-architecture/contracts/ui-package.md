# Contract: @bubblyclouds-app/ui Package

**Package**: `@bubblyclouds-app/ui`
**Version**: 2.0.0 (initial after refactoring)
**Type**: React component library + styling
**Platform**: Browser-based (Next.js, React)

---

## Public API

### Components

#### Header

Application header with navigation and user menu.

**Props**:
```typescript
interface HeaderProps {
  title?: string;
  subtitle?: string;
  showUserMenu?: boolean;
  onUserMenuClick?: () => void;
  navigationItems?: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}
```

**Behavior**:
- Responsive design (mobile, tablet, desktop)
- Shows authenticated user avatar/name when logged in
- Hamburger menu on mobile
- Dark mode aware

---

#### Footer

Application footer with branding and links.

**Props**:
```typescript
interface FooterProps {
  companyName?: string;
  companyUrl?: string;
  socialLinks?: SocialLink[];
  legalLinks?: LegalLink[];
}

interface SocialLink {
  platform: 'twitter' | 'github' | 'linkedin' | 'facebook';
  url: string;
}

interface LegalLink {
  label: string;
  href: string;
}
```

**Behavior**:
- Responsive layout
- Dark mode aware
- Accessible links

---

#### Button

Reusable button component with variants.

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}
```

---

#### Modal

Dialog/modal component for overlays.

**Props**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  closeOnBackdropClick?: boolean;
}
```

---

### Hooks

#### useTheme

Access and modify application theme.

**Returns**:
```typescript
interface UseThemeReturn {
  mode: 'light' | 'dark' | 'auto';
  setMode: (mode: 'light' | 'dark' | 'auto') => void;
  isDark: boolean;
  colors: ColorScheme;
}

interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}
```

---

#### useDarkMode

Quick access to dark mode state.

**Returns**:
```typescript
interface UseDarkModeReturn {
  isDark: boolean;
  toggle: () => void;
}
```

---

### Providers

#### ThemeProvider

Wraps application with theme context and dark mode support.

**Props**:
```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: 'light' | 'dark' | 'auto';
  storageKey?: string;
}
```

---

### Types (Public Exports)

```typescript
export type { ThemeConfig, ColorScheme } from './types/Theme';
export type { NavItem, SocialLink, LegalLink } from './types/Navigation';
```

---

## Styling System

### Tailwind CSS Integration

- All components use Tailwind CSS utilities
- Custom theme configuration in `tailwind.config.js`
- Dark mode support via `dark:` prefix
- Responsive design via `sm:`, `md:`, `lg:`, `xl:` prefixes

### Custom Theme

```typescript
// tailwind.config.js in UI package
module.exports = {
  theme: {
    colors: {
      primary: '#3B82F6',      // Blue
      secondary: '#8B5CF6',    // Purple
      background: '#FFFFFF',
      'dark-background': '#1F2937',
      // ... more colors
    },
    fontFamily: {
      sans: ['Inter', 'system-ui'],
    },
  },
  darkMode: 'class',  // Enable dark mode
};
```

---

## Integration Points

### Dependencies

- `@bubblyclouds-app/types`: Core types
- React 18+
- Tailwind CSS 3+
- next-themes (dark mode management)

### No Dependencies On

- ❌ `@bubblyclouds-app/auth`
- ❌ `@bubblyclouds-app/sudoku`
- ❌ `@bubblyclouds-app/template`
- ❌ App-specific code

---

## Contract Guarantees

### Stability

1. **Component API is stable**: Props will not change without MAJOR version bump
2. **Styling is stable**: Visual appearance consistent across versions
3. **Accessibility is required**: All components meet WCAG 2.1 AA standards

### Behavior Guarantees

1. **Responsive design**: Components work on all screen sizes
2. **Dark mode support**: All components support both light and dark modes
3. **Keyboard navigation**: All interactive components fully keyboard accessible
4. **Semantic HTML**: All components use proper semantic HTML structure
5. **Performance**: Components render efficiently without unnecessary re-renders

### Testing Guarantees

1. **100% of public API is testable**
2. **Visual regression testing**: Component screenshots remain consistent
3. **Accessibility testing**: Components pass automated accessibility checks

---

## Consumer Contract

### Apps Using This Package Must:

1. Wrap application root with `<ThemeProvider>`
2. Import Tailwind CSS styles
3. Use component props correctly (no prop spreading without validation)
4. Handle responsive design (or use component's responsive defaults)
5. Implement required ARIA labels for interactive components

### Apps Must NOT:

1. ❌ Override component styles with custom CSS (breaks consistency)
2. ❌ Modify component DOM structure
3. ❌ Use deprecated components without migration path
4. ❌ Render components outside of ThemeProvider

---

## Component Library Standards

### All Components Must Have

- [ ] PropTypes or TypeScript types
- [ ] Default props
- [ ] Unit tests (minimum 80% coverage)
- [ ] Storybook story for visual testing
- [ ] Documentation (JSDoc + README)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Mobile/tablet/desktop variants tested

---

## Versioning Strategy

**Current Version**: 2.0.0

**Semantic Versioning**:
- `2.1.0`: Add new Button variant
- `2.0.1`: Fix Button hover color bug
- `3.0.0`: Remove deprecated Modal component (breaking)

---

## Migration Path (from v1.x to v2.0.0)

Old (v1.x):
```typescript
// Components scattered across app
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { useTheme } from 'src/hooks/useTheme';
```

New (v2.0.0):
```typescript
// Components from UI package
import { Header, Footer, useTheme } from '@bubblyclouds-app/ui';
```

**Migration Steps**:
1. Update imports to use `@bubblyclouds-app/ui`
2. Remove old component files
3. Ensure ThemeProvider wraps app root
4. Update styling to use shared theme colors
5. Update tests to match new component APIs

---

## Quality Gates

Before UI package can be shipped:

- [ ] All components have TypeScript types
- [ ] All components responsive (mobile, tablet, desktop)
- [ ] All components support dark mode
- [ ] All components have unit tests (80% coverage minimum)
- [ ] All interactive components keyboard navigable
- [ ] All components pass accessibility audit (WCAG 2.1 AA)
- [ ] All components have Storybook stories
- [ ] No console warnings in tests
- [ ] Bundle size reasonable (<50KB gzipped for core components)
