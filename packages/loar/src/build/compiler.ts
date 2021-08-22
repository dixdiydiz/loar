import webpack from 'webpack'
import fsPromises from 'fs/promises'
import type { Compiler, Compilation } from 'webpack'
import chalk from 'chalk'
import ConfigMerger from '../config/configMerger'
import path from 'path'

export function createCompiler(config: webpack.Configuration): {
  compiler: Compiler
  logger: ReturnType<Compilation['getLogger']>
} {
  const mode = config.mode
  let logName
  if (mode === 'development') {
    logName = 'Server'
  } else {
    logName = 'Build'
  }
  const compiler = webpack(config)
  const logger = compiler.getInfrastructureLogger(logName)
  return {
    compiler,
    logger
  }
}

export async function buildCommand(merger: ConfigMerger) {
  const config = merger.cleanWebpackConfig()
  const distpath = config?.output?.path
  if (distpath) {
    await fsPromises.rmdir(distpath, { recursive: true }).catch((err) => {
      console.error(chalk.red(err))
    })
  }
  const { compiler } = createCompiler(config)
  compiler.run((err, stats) => {
    if (err) {
      console.error(chalk.redBright(err.stack || err))
      return
    }
    if (stats?.hasErrors()) {
      console.error(
        chalk.redBright(
          stats.toString({
            all: false,
            errors: true,
            colors: true
          })
        )
      )
    }
    compiler.close((err) => {
      if (err) {
        console.error('closeErr', chalk.red(err))
      }
      if (merger.publicPath) {
        const { base: templateName } = path.parse(merger.templateFile)
        const outpoutpath = config.output!.path!
        ;(async function () {
          try {
            const dir = await fsPromises.opendir(merger.publicPath)
            for await (const { name } of dir) {
              if (name !== templateName) {
                fsPromises.copyFile(
                  path.resolve(merger.publicPath, name),
                  path.resolve(outpoutpath, name)
                )
              }
            }
          } catch (e) {
            console.error(chalk.red(err))
          }
        })()
      }
    })
  })
}
