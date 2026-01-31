/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/app/layout.tsx',
    '!src/app/providers.tsx',
    '!src/**/index.{ts,tsx}',
  ],
  coverageReporters: ['json', 'json-summary', 'text', 'lcov', 'clover'],
  moduleNameMapper: {
    '^@/(.+)$': '<rootDir>/src/$1',
    '^@/data/(.+)$': '<rootDir>/data/$1',
    '^react-feather$': '<rootDir>/../../jest.setup.featherIcons.js',
    '^next/image$': '<rootDir>/../../jest.setup.nextImage.js',
  },
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.js'],
  testTimeout: 10000,
  transformIgnorePatterns: [
    'node_modules/(?!.pnpm)',
    'node_modules/.pnpm/(?!(github-slugger)@)',
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  passWithNoTests: true,
};

module.exports = config;
