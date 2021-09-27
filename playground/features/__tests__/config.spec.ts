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
  it('style features', async () => {
    expect(
      await page.$eval('p.fontFromSass', (el) =>
        window.getComputedStyle(el).getPropertyValue('color')
      )
    ).toMatch('rgb(224, 9, 80)')
    expect(
      await page.$eval('p.fontFromLess', (el) =>
        window.getComputedStyle(el).getPropertyValue('color')
      )
    ).toMatch('rgb(25, 101, 187)')
    expect(
      await page.$eval('p#moduleStyle', (el) =>
        window.getComputedStyle(el).getPropertyValue('font-size')
      )
    ).toMatch('18px')
  })
})

export {}
