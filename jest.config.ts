import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'jest-playwright-preset',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  testEnvironmentOptions: {
    'jest-playwright': {
      browsers: ['chromium'],
      exitOnPageError: false,
      launchOptions: {
        headless: true
      }
    }
  },
  globalSetup: './jestScripts/jestGlobalSetup.js',
  globalTeardown: './jestScripts/jestGlobalTeardown.js',
  setupFilesAfterEnv: ['./jestScripts/jestPerTestSetup.ts'],
  testMatch: process.env.VITE_TEST_BUILD
    ? ['**/playground/**/*.spec.[jt]s?(x)']
    : ['**/*.spec.[jt]s?(x)'],
  testTimeout: process.env.CI ? 30000 : 10000,
  globals: {
    'ts-jest': {
      tsconfig: './playground/tsconfig.json'
    }
  }
}

export default config
