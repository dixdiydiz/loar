const sirv = require('sirv')
const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawnSync, spawn } = require('child_process')
const { cutoutBasePath } = require('../playground/testHelper')

const isBuildTest = !!process.env.TEST_PRAYGROUND

let server
let child
let err
let distPath

beforeAll(async () => {
  if (!page) {
    return
  }
  try {
    const testPath = expect.getState().testPath
    const basePath = cutoutBasePath(testPath)
    if (basePath) {
      if (isBuildTest) {
        spawnSync('npm run build', {
          stdio: 'inherit',
          shell: true,
          cwd: basePath
        })
        distPath = path.resolve(basePath, 'dist')
        const fn = sirv(distPath)
        server = http.createServer(fn)
        let port = 5000
        const url = await new Promise((resolve, reject) => {
          const onError = (e) => {
            if (e.code === 'EADDRINUSE') {
              server.close()
              server.listen(++port)
            } else {
              reject(e)
            }
          }
          server.on('error', onError)
          server.listen(port, () => {
            server.removeListener('error', onError)
            resolve(`http://localhost:${port}/`)
          })
        })
        await page.goto(url)
      } else {
        const port = 8000
        const url = await new Promise((resolve, reject) => {
          child = spawn('npm run serve', {
            shell: true,
            cwd: basePath
          })
          child.on('error', (err) => {
            console.error(err)
            reject(err)
          })
          child.stdout.on('data', (data) => {
            if (data.includes('compiled successfully')) {
              resolve(`http://localhost:${port}/`)
            }
          })
        })
        await page.goto(url)
      }
    }
  } catch (e) {
    err = e
    await page.close()
  }
}, 30000)

afterAll(async () => {
  await page?.close()
  if (child) {
    child.kill('SIGINT')
  }
  if (isBuildTest) {
    await server?.close()
  }
  if (err) {
    throw err
  }
})
