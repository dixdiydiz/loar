import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'jest-playwright-preset',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  testEnvironmentOptions: {
    'jest-playwright': {
      browsers: ['chromium', 'firefox', 'webkit'],
      exitOnPageError: false, // GitHub currently throws errors
      launchOptions: {
        headless: true
      }
    }
  },
  testMatch: process.env.VITE_TEST_BUILD
    ? ['**/playground/**/*.spec.[jt]s?(x)']
    : ['**/*.spec.[jt]s?(x)'],
  testTimeout: process.env.CI ? 30000 : 10000,
  // moduleNameMapper: {
  //   testUtils: '<rootDir>/packages/playground/testUtils.ts'
  // },
  globals: {
    'ts-jest': {
      tsconfig: './playground/tsconfig.json'
    }
  }
}

export default config
