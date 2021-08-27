const {
  globalTeardown: playwrightGlobalTeardown
} = require('jest-playwright-preset')

module.exports = async function (globalConfig) {
  await global.__BROWSER_SERVER__.close()
  await playwrightGlobalTeardown(globalConfig)
}
