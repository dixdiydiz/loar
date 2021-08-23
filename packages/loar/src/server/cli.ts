import { createCompiler } from '../build/compiler'
import ConfigMerger from '../config/configMerger'
import WebpackDevServer from 'webpack-dev-server'

export async function serveCommand(
  merger: ConfigMerger
): Promise<WebpackDevServer> {
  const webpackConfig = merger.cleanWebpackConfig()
  const devServerOptions = merger.resolvedConfig.devServer!
  const { compiler, logger } = createCompiler(webpackConfig)
  // @ts-ignore
  const server = new WebpackDevServer(devServerOptions, compiler)
  // @ts-ignore
  server.start().catch((e: any) => {
    console.error(e)
  })
  return server
}
