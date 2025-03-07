import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      reporters: ['dot'],
      watch: false,
      poolOptions: {
        threads: {
          singleThread: true,
        },
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.{js,jsx,ts,tsx}'],
        exclude: [
          'src/**/*.d.ts',
          'src/**/*.test.{js,jsx,ts,tsx}',
          'src/lib/test/**',
        ],
        all: true,
        reportsDirectory: './coverage',
      },
    },
  }),
);
