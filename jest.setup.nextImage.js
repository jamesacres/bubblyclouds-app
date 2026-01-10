// Mock Next.js Image component
const React = require('react');

const Image = React.forwardRef(({ src, alt, width, height, ...props }, ref) => {
  return React.createElement('img', {
    ref,
    src,
    alt,
    width,
    height,
    ...props,
    'data-testid': 'next-image',
  });
});

Image.displayName = 'Image';

module.exports = {
  __esModule: true,
  default: Image,
};
