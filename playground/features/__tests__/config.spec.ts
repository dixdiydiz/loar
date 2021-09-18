import fs from 'fs'
import path from 'path'

describe('all features', () => {
  it('app element', async () => {
    expect(await page.textContent('#app')).toMatch('1')
    expect(await page.textContent('#machine_env')).toMatch('machine_env')
    expect(await page.textContent('#machine_local')).toMatch('machine_local')
    expect(await page.textContent('#machine_extra')).toMatch('machine_extra')
  }, 50000)
  it('dotenv features', async () => {
    expect(await page.textContent('#machine_env')).toMatch('machine_env')
    expect(await page.textContent('#machine_local')).toMatch('machine_local')
    expect(await page.textContent('#machine_extra')).toMatch('machine_extra')
  }, 50000)
})
