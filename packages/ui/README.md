# @bubblyclouds-app/ui

Shared UI components and theming package for multi-platform applications.

## Purpose

Provides reusable, accessible UI components with built-in theming support (dark/light mode, custom theme colors) and responsive design for web, iOS, Android, and desktop applications.

## Responsibility

- Reusable UI components (header, footer, navigation)
- Theme management (dark/light mode, color schemes)
- Responsive design and mobile optimization
- Platform-specific UI adaptations
- Accessibility compliance (WCAG 2.1)
- Tailwind CSS configuration

## Public API

### Components

#### `Header`
Application header with navigation and branding.

```tsx
import { Header } from '@bubblyclouds-app/ui';

<Header
  title="My App"
  showBack={false}
  rightContent={<UserMenu />}
/>
```

**Props:**
- `title?: string` - Header title
- `showBack?: boolean` - Show back button
- `rightContent?: ReactNode` - Content to display on the right side

#### `Footer`
Application footer with links and information.

```tsx
import { Footer } from '@bubblyclouds-app/ui';

<Footer />
```

#### `HeaderBack`
Back button component for navigation.

```tsx
import { HeaderBack } from '@bubblyclouds-app/ui';

<HeaderBack href="/previous-page" />
```

**Props:**
- `href?: string` - URL to navigate to
- `onClick?: () => void` - Custom click handler

#### `ThemeControls`
Complete theme control panel with dark/light mode and color selection.

```tsx
import { ThemeControls } from '@bubblyclouds-app/ui';

<ThemeControls />
```

#### `ThemeSwitch`
Toggle switch for dark/light mode.

```tsx
import { ThemeSwitch } from '@bubblyclouds-app/ui';

<ThemeSwitch />
```

#### `ThemeColorSwitch`
Color picker for theme color customization.

```tsx
import { ThemeColorSwitch } from '@bubblyclouds-app/ui';

<ThemeColorSwitch />
```

#### `Toggle`
Generic toggle switch component.

```tsx
import { Toggle } from '@bubblyclouds-app/ui';

<Toggle
  enabled={isEnabled}
  setEnabled={setIsEnabled}
  label="Enable feature"
/>
```

**Props:**
- `enabled: boolean` - Current toggle state
- `setEnabled: (enabled: boolean) => void` - State setter
- `label?: string` - Accessible label

### Providers

#### `ThemeColorProvider`
React context provider for theme color management. Place at the root of your application.

```tsx
import { ThemeColorProvider } from '@bubblyclouds-app/ui';

<ThemeColorProvider>
  <App />
</ThemeColorProvider>
```

#### `useThemeColor`
Hook to access and modify theme colors.

```tsx
import { useThemeColor } from '@bubblyclouds-app/ui';

function MyComponent() {
  const { themeColor, setThemeColor } = useThemeColor();

  return (
    <div style={{ color: themeColor }}>
      Themed content
    </div>
  );
}
```

**Returns:**
- `themeColor: string` - Current theme color (hex)
- `setThemeColor: (color: string) => void` - Update theme color

### Helpers

#### Platform Detection

```tsx
import { isCapacitor, isIOS, isAndroid } from '@bubblyclouds-app/ui';

if (isCapacitor()) {
  // Running on mobile (iOS or Android)
}

if (isIOS()) {
  // Running on iOS
}

if (isAndroid()) {
  // Running on Android
}
```

**Functions:**
- `isCapacitor(): boolean` - Check if running on Capacitor (mobile)
- `isIOS(): boolean` - Check if running on iOS
- `isAndroid(): boolean` - Check if running on Android

### Types

#### `ThemeConfig`
Theme configuration interface.

```typescript
interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  color: string;
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}
```

## Integration Guide

### 1. Basic Setup

Wrap your application with `ThemeColorProvider`:

```tsx
import { ThemeColorProvider } from '@bubblyclouds-app/ui';

function App() {
  return (
    <ThemeColorProvider>
      <YourApp />
    </ThemeColorProvider>
  );
}
```

### 2. Using Layout Components

Use header and footer components for consistent layout:

```tsx
import { Header, Footer } from '@bubblyclouds-app/ui';

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header title="My Application" />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

### 3. Theme Customization

Add theme controls to your settings page:

```tsx
import { ThemeControls } from '@bubblyclouds-app/ui';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <section>
        <h2>Theme</h2>
        <ThemeControls />
      </section>
    </div>
  );
}
```

### 4. Custom Themed Components

Create components that respond to theme changes:

```tsx
import { useThemeColor } from '@bubblyclouds-app/ui';

function ThemedButton({ children }) {
  const { themeColor } = useThemeColor();

  return (
    <button
      style={{
        backgroundColor: themeColor,
        color: 'white',
      }}
    >
      {children}
    </button>
  );
}
```

### 5. Platform-Specific UI

Adapt UI based on platform:

```tsx
import { isIOS, isAndroid } from '@bubblyclouds-app/ui';

function PlatformSpecificUI() {
  if (isIOS()) {
    return <IOSStyleButton />;
  }

  if (isAndroid()) {
    return <MaterialButton />;
  }

  return <WebButton />;
}
```

## Dependencies

```json
{
  "react": "^18",
  "react-dom": "^18",
  "next": "^15",
  "next-themes": "^0.2.1",
  "tailwindcss": "^4.0.0",
  "@capacitor/core": "^6",
  "@capacitor/status-bar": "^6",
  "@headlessui/react": "^2",
  "react-feather": "^2"
}
```

## Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm test
```

## Styling

This package uses Tailwind CSS 4.0 for styling. All components are fully styled and ready to use. You can customize the theme by:

1. **Using ThemeColorProvider**: Change theme colors dynamically
2. **Extending Tailwind config**: Customize default styles in your app
3. **CSS variables**: Override CSS custom properties

### Example: Custom Theme Colors

```tsx
import { ThemeColorProvider } from '@bubblyclouds-app/ui';

function App() {
  return (
    <ThemeColorProvider defaultColor="#3B82F6">
      <YourApp />
    </ThemeColorProvider>
  );
}
```

## Examples

### Complete Layout with Theme

```tsx
import {
  Header,
  Footer,
  ThemeControls,
  ThemeColorProvider,
  useThemeColor
} from '@bubblyclouds-app/ui';

function App() {
  return (
    <ThemeColorProvider>
      <Layout />
    </ThemeColorProvider>
  );
}

function Layout() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header title="My App" rightContent={<ThemeControls />} />
      <main className="container mx-auto px-4 py-8">
        <Content />
      </main>
      <Footer />
    </div>
  );
}
```

### Responsive Navigation

```tsx
import { Header, HeaderBack } from '@bubblyclouds-app/ui';
import { useRouter } from 'next/router';

function NavigationExample() {
  const router = useRouter();
  const showBack = router.pathname !== '/';

  return (
    <Header
      title="Page Title"
      showBack={showBack}
      rightContent={<MenuButton />}
    />
  );
}
```

### Custom Toggle Component

```tsx
import { Toggle } from '@bubblyclouds-app/ui';
import { useState } from 'react';

function FeatureToggle() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="space-y-4">
      <Toggle
        enabled={enabled}
        setEnabled={setEnabled}
        label="Enable notifications"
      />
      {enabled && <NotificationSettings />}
    </div>
  );
}
```

## Accessibility

All components in this package are built with accessibility in mind:

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance (WCAG 2.1 AA)

## Platform Support

- **Web**: Full support with Next.js 15
- **iOS**: Capacitor 6+ with status bar integration
- **Android**: Capacitor 6+ with Material Design support
- **Desktop**: Electron-compatible

## Notes

- All components support dark mode automatically via `next-themes`
- Theme preferences are persisted in localStorage
- Components are tree-shakeable for optimal bundle size
- Mobile components adapt to safe areas (notch, home indicator)
- Status bar color matches theme on mobile platforms

## Related Packages

- `@bubblyclouds-app/auth` - Authentication package (uses UI components)
- `@bubblyclouds-app/template` - Application templates (uses UI components)
- `next-themes` - Theme management library
- `@headlessui/react` - Accessible component primitives

## Version

Current version: 0.1.0
