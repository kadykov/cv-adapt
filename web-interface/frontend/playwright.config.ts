import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    browserName: 'webkit',
  },
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../backend && TESTING=1 uvicorn app.main:app --host localhost --port 8000',
      url: 'http://localhost:8000/docs',
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      env: {
        TESTING: '1',
      },
    },
  ],
});
