// import connect from 'connect'
// import http from 'http'
// import os from 'os'
// import type { Configuration, Watching, Compilation } from 'webpack'
// import chalk from 'chalk'
// import { createCompiler } from '../build/compiler'
// import watchingMiddleware from './middleware/watchingMiddleware'
// import type { UserConfig } from '../config/configMerger'
// import ConfigMerger from '../config/configMerger'
//

// TODO: delete
// export async function serveCommand(
//   merger: ConfigMerger
// ): Promise<{ watching: Watching; server: http.Server }> {
//   const { https, host: hostname, port } = config.devServer!
//   const { host, name } = resolveHost(hostname)
//   const { server, watching, logger } = createServerContext(webpackConfig)
//   server.on('error', (e: NodeJS.ErrnoException) => {
//     if (e.code === 'EADDRINUSE') {
//       logger.error(`Port ${port} has been occupied, please try other one`)
//       watching.close((closeErr) => {
//         console.error(chalk(closeErr))
//       })
//       server.close()
//       process.exit(1)
//     }
//   })
//   server.listen(port, host)
//   printServerUrl(!!https, host, name, port, logger)
//   return {
//     server,
//     watching
//   }
// }
// export function createServerContext(webpackConfig: Configuration): {
//   server: http.Server
//   logger: ReturnType<Compilation['getLogger']>
//   watching: Watching
// } {
//   const { compiler, logger } = createCompiler(webpackConfig)
//
//   const app = connect()
//   app.use(watchingMiddleware(compiler, logger))
//   const server = http.createServer(app)
//   return {
//     server,
//     logger,
//     watching: compiler.watching
//   }
// }
//
// function resolveHost(hostname: string | boolean | undefined): {
//   host: string | undefined
//   name: string | undefined
// } {
//   let host: string | undefined
//   if (hostname === 'localhost' || hostname == undefined || hostname === false) {
//     host = '127.0.0.1'
//   } else if (hostname === true) {
//     //means 0.0.0.0 or :: (listen on all IPs)
//     host = undefined
//   } else {
//     host = hostname
//   }
//   const name = ['127.0.0.1', undefined, '::', '0.0.0.0'].includes(host)
//     ? 'localhost'
//     : host
//   return { host, name }
// }
//
// function printServerUrl(
//   ssl: boolean,
//   host: string | undefined,
//   name: string | undefined,
//   port: number | undefined,
//   logger: ReturnType<Compilation['getLogger']>
// ) {
//   logger.info('Starting webpack server at: ')
//   const protocol = ssl ? 'https://' : 'http://'
//   if (host === '127.0.0.1') {
//     logger.info(chalk.cyan(` > ${protocol}${name}:${port}`))
//     logger.info(chalk.cyan(` > ${protocol}${host}:${port}`))
//   } else {
//     Object.values(os.networkInterfaces())
//       .flat()
//       .forEach((info) => {
//         if (info?.family === 'IPv4') {
//           logger.info(chalk.cyan(` > ${protocol}${info.address}:${port}`))
//         }
//       })
//   }
// }
