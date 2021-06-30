import webpack from 'webpack'
import type { Compiler, Compilation } from 'webpack'
import chalk from 'chalk'

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

export function buildCommand(config: webpack.Configuration) {
  const { compiler } = createCompiler(config)
  compiler.run((err, stats) => {
    console.log(JSON.stringify(stats))
    if (err) {
      console.error(chalk.red(err))
    }
    compiler.close((closeErr) => console.error(chalk.red(closeErr)))
  })
}
