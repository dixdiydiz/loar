import fs from 'fs'

test('.js configuration file', async () => {
  expect(await page.textContent('.app')).toMatch('1')
})
