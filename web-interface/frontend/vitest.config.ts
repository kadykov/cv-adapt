/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setupTests.ts'],
    testTimeout: 10000, // Increase timeout to 10 seconds
    reporter: 'basic',
    pretty: false,
    silent: true
  }
});
