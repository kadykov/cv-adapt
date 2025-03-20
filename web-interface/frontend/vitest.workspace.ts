import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    // Unit tests configuration
    extends: './vitest.config.ts',
    test: {
      name: 'unit',
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/lib/test/setup.ts'],
      include: [
        'src/**/__tests__/*.{test,spec}.{js,jsx,ts,tsx}',
        'src/**/__tests__/unit/**/*.{test,spec}.{js,jsx,ts,tsx}',
      ],
      exclude: ['src/**/__tests__/integration/**'],
    },
  },
  {
    // Integration tests configuration
    extends: './vitest.config.ts',
    test: {
      name: 'integration',
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/lib/test/integration/setup.ts'],
      include: ['src/**/__tests__/integration/*.integration.test.{ts,tsx}'],
      testTimeout: 15000,
      hookTimeout: 15000,
      retry: 2,
      maxConcurrency: 1,
      isolate: true,
      sequence: {
        shuffle: false,
      },
      poolOptions: {
        threads: {
          singleThread: true,
        },
      },
      deps: {
        optimizer: {
          web: {
            include: [
              '@testing-library/user-event',
              '@testing-library/jest-dom',
              '@testing-library/react',
            ],
          },
        },
      },
      server: {
        deps: {
          inline: [/@testing-library\/user-event/],
        },
      },
    },
  },
]);
