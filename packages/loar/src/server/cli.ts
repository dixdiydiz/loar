import http from 'http'
import os from 'os'
import chalk from 'chalk'
import { createCompiler } from '../build/compiler'
import type { UserConfig } from '../config/configMerger'
import ConfigMerger from '../config/configMerger'
import WebpackDevServer from 'webpack-dev-server'

export async function serveCommand(
  merger: ConfigMerger
): Promise<WebpackDevServer> {
  const devServerOptions = merger.resolvedConfig.devServer!
  const { compiler, logger } = createCompiler(merger.cleanWebpackConfig())
  // @ts-ignore
  const server = new WebpackDevServer(devServerOptions, compiler)
  const { https, host: hostname, port } = devServerOptions
  const { host, name } = resolveHost(hostname)
  // server.on('error', (e: NodeJS.ErrnoException) => {
  //   if (e.code === 'EADDRINUSE') {
  //     logger.error(`Port ${port} has been occupied, please try other one`)
  //     server.close()
  //     process.exit(1)
  //   }
  // })
  server.listen(port, host, () => {
    logger.info('Starting webpack server at: ')
    const protocol = https ? 'https://' : 'http://'
    if (host === '127.0.0.1') {
      logger.info(chalk.cyan(` > ${protocol}${name}:${port}`))
      logger.info(chalk.cyan(` > ${protocol}${host}:${port}`))
    } else {
      Object.values(os.networkInterfaces())
        .flat()
        .forEach((info) => {
          if (info?.family === 'IPv4') {
            logger.info(chalk.cyan(` > ${protocol}${info.address}:${port}`))
          }
        })
    }
  })
  return server
}

function resolveHost(hostname: string | boolean | undefined): {
  host: string
  name: string | undefined
} {
  let host: string
  if (hostname === 'localhost' || hostname == undefined || hostname === false) {
    host = '127.0.0.1'
  } else if (hostname === true) {
    //means 0.0.0.0 or :: (listen on all IPs)
    host = '0.0.0.0'
  } else {
    host = hostname
  }
  const name = ['127.0.0.1', undefined, '::', '0.0.0.0'].includes(host)
    ? 'localhost'
    : host
  return { host, name }
}
