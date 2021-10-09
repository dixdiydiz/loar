describe('.js configuration file', () => {
  test('.js configuration file', async () => {
    expect(await page.textContent('.app')).toMatch('1')
  })
})

export {}
