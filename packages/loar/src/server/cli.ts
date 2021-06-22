import connect from 'connect'
import http from 'http'
import type { Configuration, Watching, Compiler, Compilation } from 'webpack'
import { createProxyMiddleware } from 'http-proxy-middleware'
import mime from 'mime-types'
import { createCompiler } from '../build/compiler'
import watchingMiddleware from './middleware/watchingMiddleware'
import type { DevServer } from '../config'

export function createServerContext({
  devConfig,
  webapckConfig
}: {
  devConfig: DevServer
  webapckConfig: Configuration
}): {
  server: http.Server
  logger: ReturnType<Compilation['getLogger']>
  compiler: Compiler
  watching: Watching
} {
  const { compiler, logger } = createCompiler(webapckConfig)

  const app = connect()
  app.use(watchingMiddleware(compiler, logger))
  const server = http.createServer(app)
  return {
    server,
    logger,
    compiler,
    watching: compiler.watching
  }
}
