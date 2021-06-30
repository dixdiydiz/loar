import webpack from 'webpack'
import type { Compiler, Compilation } from 'webpack'

export function createCompiler(config: webpack.Configuration): {
  compiler: Compiler
  logger: ReturnType<Compilation['getLogger']>
} {
  const config1 = {
    ...config,
    aaa: 1
  }
  const DEV = process.env.MODE === 'development'
  let logName = 'Build'
  const compiler = webpack(config1)
  if (DEV) {
    logName = 'Server'
  }
  const logger = compiler.getInfrastructureLogger(logName)
  return {
    compiler,
    logger
  }
}
