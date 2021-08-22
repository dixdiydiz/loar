import type { Configuration as WebpackConfig } from 'webpack'
import { constants as fsConstants } from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { build } from 'esbuild'
import ConfigMerger from './configMerger'
import type { UserConfig } from './configMerger'

export interface CommandOptions {
  config?: string
  staging?: string
  progress?: boolean
}

export async function initConfig(options: CommandOptions): Promise<{
  merger: ConfigMerger
  configfile: string
}> {
  const mode: WebpackConfig['mode'] = process.env.MODE as WebpackConfig['mode']
  const { staging = mode } = options

  let config: UserConfig
  const merger = new ConfigMerger(mode)
  let { config: configfile = '' } = options
  const supportExt = ['.json', '.js', '.ts'] as const

  if (!configfile) {
    for (const ext of supportExt) {
      const filepath = path.resolve(process.cwd(), `loar.config${ext}`)
      const canFound = await fsPromises
        .access(filepath, fsConstants.R_OK)
        .then(() => true)
        .catch(() => false)
      if (canFound) {
        configfile = filepath
        break
      }
    }
  }
  const ext = path.parse(configfile).ext as typeof supportExt[number]
  switch (ext) {
    case '.json':
    case '.js':
      config = await import(configfile)
      break
    case '.ts': {
      const { outputFiles } = await build({
        entryPoints: [configfile],
        platform: 'node',
        format: 'cjs',
        target: ['node14'],
        define: {
          'import.meta.env.MODE': JSON.stringify(mode),
          'process.env.MODE': JSON.stringify(mode)
        },
        write: false
      })
      const transformFile = path.resolve(
        process.cwd(),
        '.__LOAR_provisional.js'
      )
      await fsPromises.writeFile(transformFile, outputFiles[0].text)
      const transformed = await import(transformFile).finally(() => {
        fsPromises.rm(transformFile)
      })
      config = transformed.default || transformed
      break
    }
    default:
      throw Error(
        'The configuration file used an unsupported file or path error'
      )
  }
  config = {
    ...config,
    progress: options.progress
  }
  merger.setConfig(config, { staging })
  return {
    merger,
    configfile
  }
}
