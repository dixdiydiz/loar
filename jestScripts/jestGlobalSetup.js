const { globalSetup: playwrightGlobalSetup } = require('jest-playwright-preset')
const { chromium } = require('playwright')

module.exports = async function (globalConfig) {
  await playwrightGlobalSetup(globalConfig)

  const browserServer = await chromium.launchServer()
  global.__BROWSER_SERVER__ = browserServer
}
