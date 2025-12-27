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
    '!src/**/index.{ts,tsx}',
  ],
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.js'],
  testTimeout: 10000,
  moduleNameMapper: {
    '^@sudoku-web/games/(.*)$': '<rootDir>/../games/src/$1',
    '^@sudoku-web/template/(.*)$': '<rootDir>/../template/src/$1',
    '^@sudoku-web/auth/(.*)$': '<rootDir>/../auth/src/$1',
    '^@sudoku-web/ui/(.*)$': '<rootDir>/../ui/src/$1',
    '^@sudoku-web/types/(.*)$': '<rootDir>/../types/src/$1',
    '^@sudoku-web/shared/(.*)$': '<rootDir>/../shared/src/$1',
  },
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
};

module.exports = config;
