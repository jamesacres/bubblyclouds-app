// Jest setup file for test environment configuration
// Add custom matchers or global test utilities here

// Import testing-library matchers
require('@testing-library/jest-dom');

// Mock @headlessui/react components
jest.mock('@headlessui/react', () => {
  const React = require('react');
  const Fragment = React.Fragment;

  // Helper to handle children as function or JSX
  const renderChildren = (children) => {
    if (typeof children === 'function') {
      return children({});
    }
    return children;
  };

  // Filter out HeadlessUI-specific animation and control props that React doesn't recognize
  const filterHeadlessUIProps = (props) => {
    const { children: _children, as: _as, ...rest } = props;
    const filtered = {};
    const headlessUIProps = new Set([
      'enter',
      'enterFrom',
      'enterTo',
      'entered',
      'leave',
      'leaveFrom',
      'leaveTo',
      'appear',
      'show',
      'static',
      'unmount',
      'as', // Remove the 'as' prop from HTML attributes
    ]);

    for (const [key, value] of Object.entries(rest)) {
      if (!headlessUIProps.has(key)) {
        filtered[key] = value;
      }
    }
    return filtered;
  };

  // Helper to get the element type based on 'as' prop
  const getElementType = (as) => {
    if (!as) return 'div';
    if (as === Fragment) return Fragment;
    if (typeof as === 'string') return as;
    if (typeof as === 'function') return as;
    return 'div';
  };

  // Transition components
  const Transition = ({ children, as, show, ...props }) => {
    // Don't render if show is explicitly false
    if (show === false) {
      return null;
    }
    const element = getElementType(as);
    if (element === Fragment) {
      return React.createElement(Fragment, null, renderChildren(children));
    }
    return React.createElement(
      element,
      filterHeadlessUIProps({ ...props }),
      renderChildren(children)
    );
  };
  Transition.Child = ({ children, as, ...props }) => {
    const element = getElementType(as);
    if (element === Fragment) {
      return React.createElement(Fragment, null, renderChildren(children));
    }
    return React.createElement(
      element,
      filterHeadlessUIProps({ ...props }),
      renderChildren(children)
    );
  };
  Transition.Root = ({ children, as, ...props }) => {
    const element = getElementType(as);
    if (element === Fragment) {
      return React.createElement(Fragment, null, renderChildren(children));
    }
    return React.createElement(
      element,
      filterHeadlessUIProps({ ...props }),
      renderChildren(children)
    );
  };

  // Create Dialog sub-components
  const DialogPanelComponent = ({ children, as, ...props }) => {
    const element = getElementType(as);
    if (element === Fragment) {
      return React.createElement(Fragment, null, renderChildren(children));
    }
    return React.createElement(
      element,
      filterHeadlessUIProps({ ...props }),
      renderChildren(children)
    );
  };
  const DialogTitleComponent = ({ children, as, ...props }) => {
    const element = getElementType(as);
    if (element === Fragment) {
      return React.createElement(Fragment, null, children);
    }
    return React.createElement(
      element || 'h2',
      filterHeadlessUIProps({ ...props }),
      children
    );
  };
  const DialogDescriptionComponent = ({ children, as, ...props }) => {
    const element = getElementType(as);
    if (element === Fragment) {
      return React.createElement(Fragment, null, children);
    }
    return React.createElement(
      element || 'p',
      filterHeadlessUIProps({ ...props }),
      children
    );
  };

  // Create Dialog component with sub-components
  const DialogComponent = function Dialog({ children, as, ...props }) {
    const element = getElementType(as);
    if (element === Fragment) {
      return React.createElement(Fragment, null, renderChildren(children));
    }
    return React.createElement(
      element,
      filterHeadlessUIProps({ ...props }),
      renderChildren(children)
    );
  };
  DialogComponent.Panel = DialogPanelComponent;
  DialogComponent.Title = DialogTitleComponent;
  DialogComponent.Description = DialogDescriptionComponent;

  const mocks = {
    Switch: ({ checked, onChange, children, ...props }) =>
      React.createElement(
        'button',
        {
          ...filterHeadlessUIProps({ checked, onChange, children, ...props }),
          onClick: () => onChange && onChange(!checked),
        },
        children
      ),
    Dialog: DialogComponent,
    DialogPanel: DialogPanelComponent,
    DialogTitle: DialogTitleComponent,
    DialogDescription: DialogDescriptionComponent,
    Transition,
    'Transition.Child': Transition.Child,
    'Transition.Root': Transition.Root,
    Disclosure: ({ children, ...props }) =>
      React.createElement(
        'div',
        filterHeadlessUIProps({ children, ...props }),
        renderChildren(children)
      ),
    DisclosureButton: ({ children, ...props }) =>
      React.createElement(
        'button',
        filterHeadlessUIProps({ children, ...props }),
        renderChildren(children)
      ),
    DisclosurePanel: ({ children, ...props }) =>
      React.createElement(
        'div',
        filterHeadlessUIProps({ children, ...props }),
        renderChildren(children)
      ),
    Popover: ({ children, ...props }) =>
      React.createElement(
        'div',
        filterHeadlessUIProps({ children, ...props }),
        renderChildren(children)
      ),
    PopoverButton: ({ children, ...props }) =>
      React.createElement(
        'button',
        filterHeadlessUIProps({ children, ...props }),
        renderChildren(children)
      ),
    PopoverPanel: ({ children, ...props }) =>
      React.createElement(
        'div',
        filterHeadlessUIProps({ children, ...props }),
        renderChildren(children)
      ),
    Menu: ({ children, ...props }) =>
      React.createElement(
        'div',
        filterHeadlessUIProps({ children, ...props }),
        renderChildren(children)
      ),
    MenuButton: ({ children, ...props }) =>
      React.createElement(
        'button',
        filterHeadlessUIProps({ children, ...props }),
        renderChildren(children)
      ),
    MenuItem: ({ children, ...props }) =>
      React.createElement(
        'button',
        filterHeadlessUIProps({ children, ...props }),
        renderChildren(children)
      ),
    MenuItems: ({ children, ...props }) =>
      React.createElement(
        'div',
        filterHeadlessUIProps({ children, ...props }),
        renderChildren(children)
      ),
    Listbox: ({ children, ...props }) =>
      React.createElement(
        'div',
        filterHeadlessUIProps({ children, ...props }),
        renderChildren(children)
      ),
    ListboxButton: ({ children, ...props }) =>
      React.createElement(
        'button',
        filterHeadlessUIProps({ children, ...props }),
        renderChildren(children)
      ),
    ListboxOption: ({ children, ...props }) =>
      React.createElement(
        'div',
        filterHeadlessUIProps({ children, ...props }),
        renderChildren(children)
      ),
    ListboxOptions: ({ children, ...props }) =>
      React.createElement(
        'div',
        filterHeadlessUIProps({ children, ...props }),
        renderChildren(children)
      ),
    Tab: {
      Group: ({ children, ...props }) =>
        React.createElement(
          'div',
          filterHeadlessUIProps({ children, ...props }),
          renderChildren(children)
        ),
      List: ({ children, ...props }) =>
        React.createElement(
          'div',
          filterHeadlessUIProps({ children, ...props }),
          renderChildren(children)
        ),
      Panels: ({ children, ...props }) =>
        React.createElement(
          'div',
          filterHeadlessUIProps({ children, ...props }),
          renderChildren(children)
        ),
      Panel: ({ children, ...props }) =>
        React.createElement(
          'div',
          filterHeadlessUIProps({ children, ...props }),
          renderChildren(children)
        ),
      Button: ({ children, ...props }) =>
        React.createElement(
          'button',
          filterHeadlessUIProps({ children, ...props }),
          renderChildren(children)
        ),
    },
  };

  return mocks;
});

// Mock RevenueCat/Capacitor modules that use ESM
jest.mock(
  '@revenuecat/purchases-capacitor',
  () => ({
    Purchases: {
      configure: jest.fn().mockResolvedValue(undefined),
      setLogLevel: jest.fn().mockResolvedValue(undefined),
      getCustomerInfo: jest.fn().mockResolvedValue({ customerInfo: {} }),
      getOfferings: jest.fn().mockResolvedValue({ all: {} }),
      purchasePackage: jest.fn().mockResolvedValue({}),
      logIn: jest.fn(),
      logOut: jest.fn(),
    },
    PurchasesPackage: {},
    LOG_LEVEL: { VERBOSE: 0 },
  }),
  { virtual: true }
);

// Base WebPlugin class for Capacitor plugins
class WebPlugin {
  constructor(_options) {
    this.listeners = {};
  }
  addListener(eventName, listenerFunc) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(listenerFunc);
    return {
      remove: () => {
        if (this.listeners[eventName]) {
          this.listeners[eventName] = this.listeners[eventName].filter(
            (l) => l !== listenerFunc
          );
        }
      },
    };
  }
}

jest.mock(
  '@capacitor/core',
  () => ({
    registerPlugin: jest.fn((name) => {
      if (name === 'Share') {
        return { share: jest.fn().mockResolvedValue({}) };
      } else if (name === 'StatusBar') {
        return {
          show: jest.fn().mockResolvedValue(undefined),
          hide: jest.fn().mockResolvedValue(undefined),
          setStyle: jest.fn().mockResolvedValue(undefined),
          setBackgroundColor: jest.fn().mockResolvedValue(undefined),
          setOverlaysWebView: jest.fn().mockResolvedValue(undefined),
        };
      }
      return new WebPlugin({ name });
    }),
    CapacitorHttp: {},
    Capacitor: {
      isWebPlatform: jest.fn(() => false),
      getPlatform: jest.fn(() => 'web'),
      isPluginAvailable: jest.fn(() => false),
    },
    WebPlugin,
  }),
  { virtual: true }
);

jest.mock(
  'capacitor-secure-storage-plugin',
  () => ({
    SecureStoragePlugin: class {
      constructor() {}
      set() {
        return Promise.resolve();
      }
      get() {
        return Promise.resolve(null);
      }
      remove() {
        return Promise.resolve();
      }
    },
  }),
  { virtual: true }
);

jest.mock(
  '@capacitor/share',
  () => ({
    Share: {
      share: jest.fn().mockResolvedValue({}),
      canShare: jest.fn().mockResolvedValue({ value: false }),
    },
  }),
  { virtual: true }
);

jest.mock(
  '@capacitor/browser',
  () => ({
    Browser: {
      open: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeAllListeners: jest.fn().mockResolvedValue(undefined),
    },
  }),
  { virtual: true }
);

jest.mock(
  '@capacitor/app',
  () => ({
    App: {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeAllListeners: jest.fn().mockResolvedValue(undefined),
      minimizeApp: jest.fn().mockResolvedValue(undefined),
    },
  }),
  { virtual: true }
);

jest.mock(
  '@capacitor/status-bar',
  () => ({
    StatusBar: {
      show: jest.fn().mockResolvedValue(undefined),
      hide: jest.fn().mockResolvedValue(undefined),
      setStyle: jest.fn().mockResolvedValue(undefined),
      setBackgroundColor: jest.fn().mockResolvedValue(undefined),
      setOverlaysWebView: jest.fn().mockResolvedValue(undefined),
    },
    Style: { DEFAULT: 'DEFAULT', LIGHT: 'LIGHT', DARK: 'DARK' },
  }),
  { virtual: true }
);

jest.mock(
  '@capacitor/keyboard',
  () => ({
    Keyboard: {
      show: jest.fn().mockResolvedValue(undefined),
      hide: jest.fn().mockResolvedValue(undefined),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
    },
  }),
  { virtual: true }
);

jest.mock(
  '@capacitor-community/in-app-review',
  () => ({
    InAppReview: class InAppReview {
      constructor() {}
      requestReview() {
        return Promise.resolve();
      }
    },
  }),
  { virtual: true }
);

// Create global window object for Node environment
if (typeof window === 'undefined') {
  global.window = {};
}

// Polyfill structuredClone for older Node versions
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Mock Response class for Node.js environment
if (typeof global.Response === 'undefined') {
  global.Response = class {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Map(Object.entries(init.headers || {}));
      this.ok = this.status >= 200 && this.status < 300;
    }

    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return this.body;
    }

    async text() {
      return String(this.body);
    }

    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: Object.fromEntries(this.headers),
      });
    }
  };
}

// Mock Request class for Node.js environment
if (typeof global.Request === 'undefined') {
  global.Request = class {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Map(Object.entries(init.headers || {}));
      this.body = init.body || null;
    }
  };
}

// Mock PointerEvent for Node environment
if (
  typeof window !== 'undefined' &&
  typeof window.PointerEvent === 'undefined'
) {
  window.PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type, options = {}) {
      super(type, options);
      this.pointerId = options.pointerId || 0;
      this.width = options.width || 0;
      this.height = options.height || 0;
      this.pressure = options.pressure || 0;
      this.tangentialPressure = options.tangentialPressure || 0;
      this.tiltX = options.tiltX || 0;
      this.tiltY = options.tiltY || 0;
      this.twist = options.twist || 0;
      this.pointerType = options.pointerType || 'mouse';
      this.isPrimary = options.isPrimary !== false;
    }
  };
  global.PointerEvent = window.PointerEvent;
}

// Mock ResizeObserver for Node environment
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  if (typeof window !== 'undefined') {
    window.ResizeObserver = global.ResizeObserver;
  }
}

// Mock TextEncoder/TextDecoder for Node environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Create localStorage mock for all tests with real storage functionality
const storageData = {};
const localStorageMock = {
  getItem: jest.fn((key) => {
    return storageData[key] || null;
  }),
  setItem: jest.fn((key, value) => {
    storageData[key] = String(value);
  }),
  removeItem: jest.fn((key) => {
    delete storageData[key];
  }),
  clear: jest.fn(() => {
    Object.keys(storageData).forEach((key) => {
      delete storageData[key];
    });
  }),
  get length() {
    return Object.keys(storageData).length;
  },
  key: jest.fn((index) => {
    const keys = Object.keys(storageData);
    return keys[index] || null;
  }),
};

// Make Object.entries(localStorage) work by creating a Proxy
const localStorageProxy = new Proxy(localStorageMock, {
  get: (target, prop) => {
    if (
      typeof prop === 'string' &&
      prop !== 'getItem' &&
      prop !== 'setItem' &&
      prop !== 'removeItem' &&
      prop !== 'clear' &&
      prop !== 'key' &&
      prop !== 'length'
    ) {
      return storageData[prop];
    }
    return target[prop];
  },
  ownKeys: () => Object.keys(storageData),
  getOwnPropertyDescriptor: (target, prop) => {
    if (prop in storageData || typeof target[prop] !== 'undefined') {
      return {
        configurable: true,
        enumerable: true,
        value: storageData[prop] || target[prop],
      };
    }
  },
});

Object.defineProperty(window, 'localStorage', {
  value: localStorageProxy,
  writable: true,
});

// Make localStorage available as global
if (typeof global.localStorage === 'undefined') {
  global.localStorage = localStorageProxy;
}

// Mock window.scrollTo for jsdom (not implemented in jsdom)
// Need to use Object.defineProperty to override jsdom's not-implemented behavior
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    configurable: true,
    value: jest.fn(),
  });
}

// Mock window.confirm for jsdom (not implemented in jsdom)
// Need to use Object.defineProperty to override jsdom's not-implemented behavior
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'confirm', {
    writable: true,
    configurable: true,
    value: jest.fn(() => true),
  });
}

// Mock window.alert for jsdom
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'alert', {
    writable: true,
    configurable: true,
    value: jest.fn(),
  });
}

// Mock window.matchMedia for jsdom (not fully implemented in jsdom)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Create crypto API mock for Node environment (only if not already available)
// Use Node's built-in crypto.webcrypto if available
let cryptoMock;
if (
  typeof window.crypto !== 'undefined' &&
  window.crypto.subtle &&
  window.crypto.subtle.digest
) {
  cryptoMock = window.crypto;
} else {
  try {
    // Try to use Node's built-in crypto
    const nodeCrypto = require('crypto');
    if (nodeCrypto.webcrypto) {
      cryptoMock = nodeCrypto.webcrypto;
    } else {
      throw new Error('webcrypto not available');
    }
  } catch (_e) {
    // Fallback - still try to use Node's crypto for digest operations
    try {
      const nodeCrypto = require('crypto');
      cryptoMock = {
        getRandomValues: (arr) => {
          const randomBytes = nodeCrypto.randomBytes(
            arr.byteLength || arr.length
          );
          const view = new Uint8Array(arr);
          for (let i = 0; i < randomBytes.length; i++) {
            view[i] = randomBytes[i];
          }
          return arr;
        },
        subtle: {
          digest: async (algorithm, data) => {
            const algo = algorithm.toLowerCase().replace('-', '');
            const hash = nodeCrypto.createHash(algo);
            // Convert input to Buffer if needed
            if (data instanceof ArrayBuffer) {
              hash.update(Buffer.from(data));
            } else if (data instanceof Uint8Array) {
              hash.update(Buffer.from(data));
            } else if (typeof data === 'string') {
              hash.update(data);
            } else {
              hash.update(Buffer.from(data));
            }
            // Return as ArrayBuffer
            return hash
              .digest()
              .buffer.slice(
                hash.digest().byteOffset,
                hash.digest().byteOffset + hash.digest().byteLength
              );
          },
        },
      };
    } catch (_innerE) {
      // Final fallback - basic mock
      cryptoMock = {
        getRandomValues: (arr) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 4294967296);
          }
          return arr;
        },
        subtle: {
          digest: async (_algorithm, _data) => {
            return new ArrayBuffer(32);
          },
        },
      };
    }
  }
}

if (!window.crypto || !window.crypto.subtle) {
  if (!window.crypto) {
    window.crypto = cryptoMock;
  } else {
    window.crypto.subtle = cryptoMock.subtle;
  }
}

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = function (...args) {
    const errorMsg = typeof args[0] === 'string' ? args[0] : '';

    // Suppress expected test errors
    const suppressPatterns = [
      'Invalid cellId format',
      'An update to',
      'inside a test was not wrapped in act',
      'There are no focusable elements inside the <FocusTrap />',
      'Warning: Received `true` for a non-boolean attribute `jsx`',
      'Warning: React.jsx: type is invalid',
      'type of Received has value: null',
      "Cannot read properties of undefined (reading 'getTime')",
      'Error reading daily',
    ];

    // Check if error message matches any suppress pattern
    if (suppressPatterns.some((pattern) => errorMsg.includes(pattern))) {
      return;
    }

    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clean up theme classes after each test
afterEach(() => {
  // Remove all theme-* classes from document root
  if (typeof document !== 'undefined' && document.documentElement) {
    const classes = Array.from(document.documentElement.classList);
    classes.forEach((cls) => {
      if (cls.startsWith('theme-')) {
        document.documentElement.classList.remove(cls);
      }
    });
  }
});
