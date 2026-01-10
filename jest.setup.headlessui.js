// Mock @headlessui/react components for testing
const React = require('react');

// Mock Dialog component
const Dialog = React.forwardRef((props, ref) => {
  const { as: Component = 'div', open, onClose, children, ...rest } = props;

  if (open === false) {
    return null;
  }

  return React.createElement(
    Component,
    {
      ref,
      role: 'dialog',
      'aria-modal': 'true',
      'data-testid': 'headlessui-dialog',
      ...rest,
    },
    children
  );
});

Dialog.displayName = 'Dialog';

// Dialog.Panel component
Dialog.Panel = React.forwardRef((props, ref) => {
  const { as: Component = 'div', children, ...rest } = props;
  return React.createElement(
    Component,
    { ref, 'data-testid': 'headlessui-dialog-panel', ...rest },
    children
  );
});

Dialog.Panel.displayName = 'Dialog.Panel';

// Dialog.Title component
Dialog.Title = React.forwardRef((props, ref) => {
  const { as: Component = 'h2', children, ...rest } = props;
  return React.createElement(
    Component,
    { ref, 'data-testid': 'headlessui-dialog-title', ...rest },
    children
  );
});

Dialog.Title.displayName = 'Dialog.Title';

// Dialog.Description component
Dialog.Description = React.forwardRef((props, ref) => {
  const { as: Component = 'p', children, ...rest } = props;
  return React.createElement(
    Component,
    { ref, 'data-testid': 'headlessui-dialog-description', ...rest },
    children
  );
});

Dialog.Description.displayName = 'Dialog.Description';

// Mock Transition component
const Transition = React.forwardRef((props, ref) => {
  const {
    as: Component = React.Fragment,
    show,
    appear,
    enter,
    enterFrom,
    enterTo,
    leave,
    leaveFrom,
    leaveTo,
    children,
    ...rest
  } = props;

  // For testing, just render children without transitions
  if (show === false) {
    return null;
  }

  if (Component === React.Fragment) {
    return React.createElement(React.Fragment, {}, children);
  }

  return React.createElement(
    Component,
    { ref, 'data-testid': 'headlessui-transition', ...rest },
    children
  );
});

Transition.displayName = 'Transition';

// Transition.Child component
Transition.Child = React.forwardRef((props, ref) => {
  const {
    as: Component = React.Fragment,
    enter,
    enterFrom,
    enterTo,
    leave,
    leaveFrom,
    leaveTo,
    children,
    ...rest
  } = props;

  if (Component === React.Fragment) {
    return React.createElement(React.Fragment, {}, children);
  }

  return React.createElement(
    Component,
    { ref, 'data-testid': 'headlessui-transition-child', ...rest },
    children
  );
});

Transition.Child.displayName = 'Transition.Child';

// Mock Popover component
const Popover = React.forwardRef((props, ref) => {
  const { as: Component = 'div', children, ...rest } = props;
  return React.createElement(
    Component,
    { ref, 'data-testid': 'headlessui-popover', ...rest },
    children
  );
});

Popover.displayName = 'Popover';

// Popover.Button component
Popover.Button = React.forwardRef((props, ref) => {
  const { as: Component = 'button', children, ...rest } = props;
  return React.createElement(
    Component,
    {
      ref,
      'data-testid': 'headlessui-popover-button',
      type: 'button',
      ...rest,
    },
    children
  );
});

Popover.Button.displayName = 'Popover.Button';

// Popover.Panel component
Popover.Panel = React.forwardRef((props, ref) => {
  const { as: Component = 'div', children, ...rest } = props;
  return React.createElement(
    Component,
    { ref, 'data-testid': 'headlessui-popover-panel', ...rest },
    children
  );
});

Popover.Panel.displayName = 'Popover.Panel';

// Mock Switch component
const Switch = React.forwardRef((props, ref) => {
  const {
    checked,
    onChange,
    as: Component = 'button',
    children,
    ...rest
  } = props;

  const handleClick = () => {
    if (onChange) {
      onChange(!checked);
    }
  };

  return React.createElement(
    Component,
    {
      ref,
      role: 'switch',
      'aria-checked': checked,
      'data-testid': 'headlessui-switch',
      type: Component === 'button' ? 'button' : undefined,
      onClick: handleClick,
      ...rest,
    },
    children
  );
});

Switch.displayName = 'Switch';

// Export all mocked components
module.exports = {
  Dialog,
  Transition,
  Popover,
  Switch,
};
