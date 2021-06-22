import webpack from 'webpack'
import type { Compiler, Compilation } from 'webpack'

export function createCompiler(config: webpack.Configuration): {
  compiler: Compiler
  logger: ReturnType<Compilation['getLogger']>
} {
  const DEV = process.env.MODE === 'development'
  let logName = '__LOAR_BUILD'
  const compiler = webpack(config)
  if (DEV) {
    logName = '__LOAR_DEV'
  }
  const logger = compiler.getInfrastructureLogger(logName)
  return {
    compiler,
    logger
  }
}
