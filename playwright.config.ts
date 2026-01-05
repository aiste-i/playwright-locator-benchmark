import { defineConfig, devices } from '@playwright/test';
import { STRATEGIES } from './locators';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 8 : 4,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }], ['./cfg/reporter/reporter.ts']],

  projects: [
    ...STRATEGIES.flatMap((strategy) => [
      {
        name: `${strategy} locators - chromium`,
        use: {
          ...devices['chromium'],
          strategyName: strategy,
        },
      },
      {
        name: `${strategy} locators - firefox`,
        use: {
          ...devices['firefox'],
          strategyName: strategy,
        },
      },
      {
        name: `${strategy} locators - webkit`,
        use: {
          ...devices['webkit'],
          strategyName: strategy,
        },
      },
    ]),
  ],

  use: {
    headless: true,
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
});
