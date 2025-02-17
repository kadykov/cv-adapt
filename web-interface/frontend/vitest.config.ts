import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/lib/test/setup.ts'],
      include: ['src/**/__tests__/*.{test,spec}.{js,jsx,ts,tsx}'],
      reporters: ['dot'],
      watch: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.{js,jsx,ts,tsx}'],
        exclude: [
          'src/**/*.d.ts',
          'src/**/*.test.{js,jsx,ts,tsx}',
          'src/lib/test/**',
        ],
      },
    },
  })
);
