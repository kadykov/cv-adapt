import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/lib/test/integration/setup.ts'],
      include: ['src/**/__tests__/integration/*.integration.test.{ts,tsx}'],
      reporters: ['dot'],
      watch: false,
      testTimeout: 10000,
      hookTimeout: 10000,
      maxConcurrency: 1,
      isolate: true,
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
  }),
);
