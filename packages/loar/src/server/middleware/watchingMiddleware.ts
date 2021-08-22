// /**
//  * reference from https://github.com/webpack/webpack-dev-middleware/
//  */

// TODO: delete
// import type {
//   Compiler,
//   Compilation,
//   Watching,
//   Stats,
//   StatsCompilation
// } from 'webpack'
// import type { NextHandleFunction, IncomingMessage } from 'connect'
// import type { ServerResponse } from 'http'
// import { fs as memFs, IFs } from 'memfs'
// import type { TDataOut } from 'memfs/lib/encoding'
// import parseRange from 'range-parser'
// import path from 'path'
// import mime from 'mime-types'
//
// interface Context {
//   compiler: Compiler
//   logger: ReturnType<Compilation['getLogger']>
//   watching: Watching | null
//   statsCompilation: StatsCompilation | null
//   state: boolean
//   callbacks: ((statsCompilation: StatsCompilation) => void)[]
//   fileSystem: IFs
// }
//
// export default function wrapper(
//   compiler: Compiler,
//   logger: ReturnType<Compilation['getLogger']>,
//   appHtml?: string
// ) {
//   const context: Context = {
//     compiler,
//     logger,
//     watching: null,
//     statsCompilation: null,
//     state: false,
//     callbacks: [],
//     fileSystem: (compiler.intermediateFileSystem = memFs)
//   }
//   setupHooks(context)
//   if (!compiler.watching) {
//     compiler.watching = compiler.watch(
//       {
//         aggregateTimeout: 600,
//         poll: true,
//         ignored: /node_modules/
//       },
//       (error) => {
//         if (error) {
//           logger.error(error)
//         }
//       }
//     )
//   }
//   context.watching = compiler.watching
//   const middleware: NextHandleFunction = (req, res, next) => {
//     if (!req.method || ['GET', 'POST', 'HEAD'].includes(req.method)) {
//       next()
//     }
//     if (context.state) {
//       return processReq()
//     }
//     const name = (req && req.url) || 'unknow url'
//     context.logger.info(`wait until bundle finished${name}`)
//     context.callbacks.push(processReq)
//
//     function processReq(): void
//     function processReq(statsCompilation?: StatsCompilation): void {
//       if (!statsCompilation) {
//         statsCompilation = context.statsCompilation!
//       }
//       const filename = getFileFromUrl(
//         { statsCompilation, fileSystem: context.fileSystem },
//         new URL(req.url || '/', `http://${req.headers.host}`),
//         appHtml
//       )
//       if (!filename) {
//         return next()
//       }
//       let content = context.fileSystem.readFileSync(filename)
//       const contentType =
//         res.getHeader('Content-Type') ||
//         mime.contentType(path.extname(filename))
//       if (contentType) {
//         res.setHeader('Content-Type', contentType)
//       }
//       // Buffer
//       content = handleRangeReq(content, logger, req, res)
//
//       if (req.method === 'HEAD') {
//         res.end()
//       } else {
//         res.end(content)
//       }
//     }
//   }
//   return middleware
// }
//
// function setupHooks(context: Context): void {
//   context.compiler.hooks.watchRun.tap('watching-middleware', invalid)
//   context.compiler.hooks.invalid.tap('watching-middleware', invalid)
//   context.compiler.hooks.done.tap('watching-middleware', done)
//
//   function invalid(): void {
//     if (context.state) {
//       context.logger.log('Compilation starting...')
//     }
//     context.state = false
//     context.statsCompilation = null
//   }
//   function done(stats: Stats): void {
//     context.state = true
//     const statsCompilation = (context.statsCompilation = stats.toJson({
//       preset: 'normal'
//     }))
//     if (!context.state) {
//       return
//     }
//     context.logger.log('Compilation finished')
//     process.nextTick(() => {
//       const { callbacks } = context
//       context.callbacks = []
//       callbacks.forEach((callback) => {
//         callback(statsCompilation)
//       })
//     })
//   }
// }
//
// function getFileFromUrl(
//   context: Pick<Context, 'statsCompilation' | 'fileSystem'>,
//   url: URL,
//   appHtml?: string
// ) {
//   let foundFilename
//   const { statsCompilation } = context
//   let { outputPath, publicPath = '/' } = statsCompilation!
//   publicPath = publicPath === 'auto' ? '/' : publicPath
//   outputPath = outputPath || '/'
//   if (url.pathname.startsWith(publicPath)) {
//     let filename
//     filename = url.pathname.substring(publicPath.length)
//     if (filename) {
//       filename = path.join(outputPath, decodeURI(filename))
//     }
//     let fsStats
//     try {
//       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//       // @ts-ignore
//       fsStats = context.fileSystem.statSync(filename)
//     } catch (__ignoreError) {
//       return
//     }
//     if (fsStats.isFile()) {
//       foundFilename = filename
//     } else if (fsStats.isDirectory()) {
//       filename = path.join(filename, appHtml || 'index.html')
//       try {
//         fsStats = context.fileSystem.statSync(filename)
//       } catch (__ignoreError) {
//         return
//       }
//       if (fsStats.isFile()) {
//         foundFilename = filename
//       }
//     }
//   }
//   return foundFilename
// }
//
// function handleRangeReq(
//   content: Buffer | TDataOut,
//   logger: ReturnType<Compilation['getLogger']>,
//   req: IncomingMessage,
//   res: ServerResponse
// ): Buffer | TDataOut {
//   res.setHeader('Accept-Ranges', 'bytes')
//   if (req.method === 'HEAD') {
//     res.setHeader('Content-Length', content.length)
//   }
//   const headerRange = req.headers['range']
//   if (headerRange) {
//     const subranges = parseRange(content.length, headerRange)
//     if (subranges === -2) {
//       // malformed header string treated as regular response
//       logger.error(
//         'A malformed Range header was provided.' +
//           'A regular response will be sent for this request.'
//       )
//     } else if (subranges === -1) {
//       res.statusCode = 416
//       res.setHeader('Content-Range', `bytes */${content.length}`)
//     } else if (subranges.length !== 1) {
//       logger.error(
//         'A Range header with multiple ranges was provided. ' +
//           'Multiple ranges are not supported, ' +
//           'so a regular response will be sent for this request.'
//       )
//     } else {
//       res.statusCode = 206
//       res.setHeader(
//         'Content-Range',
//         `bytes ${subranges[0].start}-${subranges[0].end}/${content.length}`
//       )
//       content = content.slice(subranges[0].start, subranges[0].end + 1)
//     }
//   }
//   return content
// }
