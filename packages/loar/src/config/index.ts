import type { Configuration as WebpackConfig } from 'webpack'
import { constants as fsConstants } from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { build } from 'esbuild'
import { vol } from 'memfs'
import { createFsRequire } from 'fs-require'
import ConfigMerger from './configMerger'
import type { UserConfig } from './configMerger'

export async function initConfig(options: Record<string, any>): Promise<{
  merger: ConfigMerger
  configfile: string
}> {
  const mode: WebpackConfig['mode'] = process.env.MODE as WebpackConfig['mode']
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
        write: false,
        outdir: '__LOAR_OUTDIR'
      })
      vol.writeFileSync('/config.js', outputFiles[0].text)
      const original = createFsRequire(vol)('/config')
      config = original.default || original
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
  merger.setConfig(config, true).registerHooks()
  merger.resolveConfigHook()
  return {
    merger,
    configfile
  }
}
