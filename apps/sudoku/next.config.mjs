/** @type {import('next').NextConfig} */
const nextConfig =
  process.env.IS_ELECTRON === 'true' || process.env.IS_CAPACITOR === 'true'
    ? {
        output: 'export',
        images: {
          unoptimized: true,
        },
        experimental: {
          turbo: {
            rules: {
              '*.css': {
                loaders: ['@tailwindcss/postcss'],
              },
            },
          },
        },
      }
    : {
        images: {
          unoptimized: true,
        },
        experimental: {
          turbo: {
            rules: {
              '*.css': {
                loaders: ['@tailwindcss/postcss'],
              },
            },
          },
        },
      };

export default nextConfig;
