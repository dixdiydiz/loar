import fs from 'fs'
import path from 'path'

describe('.js configuration file', () => {
  test('.js configuration file', async () => {
    expect(await page.textContent('.app')).toMatch('1')
  })
})
