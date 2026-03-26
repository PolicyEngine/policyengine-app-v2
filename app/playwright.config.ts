import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const PW_VERSION = '1.58.2';
const PW_IMAGE = `mcr.microsoft.com/playwright:v${PW_VERSION}-noble`;
const PW_SERVER_PORT = 3200;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['html', { open: 'never' }], ['github']] : [['html', { open: 'on-failure' }]],

  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.005,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      stylePath: './e2e/visual/screenshot.css',
    },
  },

  use: {
    baseURL: isCI ? 'http://localhost:3000' : 'http://host.docker.internal:3000',
    trace: 'on-first-retry',
    timezoneId: 'America/New_York',
    ...(!isCI && {
      connectOptions: {
        wsEndpoint: `ws://127.0.0.1:${PW_SERVER_PORT}/`,
      },
    }),
  },

  webServer: [
    {
      command: 'VITE_APP_MODE=website npx vite',
      url: 'http://localhost:3000',
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
    ...(!isCI
      ? [
          {
            command: `docker run --rm --init -p ${PW_SERVER_PORT}:${PW_SERVER_PORT} ${PW_IMAGE} npx playwright run-server --port ${PW_SERVER_PORT} --host 0.0.0.0`,
            url: `http://localhost:${PW_SERVER_PORT}`,
            timeout: 120_000,
            reuseExistingServer: !isCI,
            gracefulShutdown: { signal: 'SIGTERM' as const, timeout: 10_000 },
          },
        ]
      : []),
  ],

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});
