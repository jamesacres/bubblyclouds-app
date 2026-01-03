// Mock react-feather icons
const React = require('react');

const mockIconComponent = (displayName) => {
  const Icon = (props) => {
    // Convert size prop to width/height like real react-feather icons
    const { size, ...restProps } = props;
    const svgProps = {
      ...restProps,
      'data-testid': displayName,
    };

    // If size is provided, add width and height as strings
    if (size) {
      svgProps.width = String(size);
      svgProps.height = String(size);
    }

    return React.createElement('svg', svgProps);
  };
  Icon.displayName = displayName;
  return Icon;
};

// Create mocks for all commonly used icons
const iconNames = [
  'Loader',
  'ChevronDown',
  'ChevronRight',
  'RotateCcw',
  'Calendar',
  'Watch',
  'Users',
  'Droplet',
  'LogOut',
  'Trash',
  'UserMinus',
  'Plus',
  'X',
  'Home',
  'Zap',
  'Settings',
  'Bell',
  'Menu',
  'ChevronLeft',
  'ArrowRight',
  'Share2',
  'Copy',
  'Eye',
  'EyeOff',
  'Check',
  'AlertCircle',
  'AlertTriangle',
  'Smartphone',
  'Download',
  'RefreshCw',
  // Additional icons used in components
  'Activity',
  'Award',
  'Book',
  'Camera',
  'Edit3',
  'Sidebar',
  'ChevronUp',
  'CornerUpLeft',
  'CornerUpRight',
  'Delete',
  'Edit',
  'Edit2',
  'Grid',
  'Minus',
  'Square',
  'Unlock',
  'Star',
];

const iconMocks = {};
iconNames.forEach((name) => {
  iconMocks[name] = mockIconComponent(name);
});

module.exports = iconMocks;
