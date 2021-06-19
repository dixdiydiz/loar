import type { Configuration as webpackConfig } from 'webpack'
import { constants as fsConstants } from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { build } from 'esbuild'
import { vol } from 'memfs'
import { createFsRequire } from 'fs-require'
import { isString, isArray, isObject } from './utils'
import type { ObjectWithAnyKey } from './global'

interface UserConfig {
  /**
   * entry html file
   */
  entry: string | ObjectWithAnyKey
  webpackConfig: webpackConfig
}

export async function initConfig(option: {
  configfile?: string
}): Promise<UserConfig> {
  const defaultConfig = {
    entry: path.resolve(process.cwd(), 'index.html')
  }
  let userConfig: UserConfig
  let { configfile = '' } = option
  const supportExt = ['.json', '.js', '.ts'] as const
  type SupportExt = typeof supportExt[number]

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
  const ext: SupportExt = path.parse(configfile).ext as SupportExt
  switch (ext) {
    case '.json':
    case '.js':
      userConfig = await import(configfile)
      break
    case '.ts': {
      const { outputFiles } = await build({
        entryPoints: [configfile],
        platform: 'node',
        format: 'cjs',
        target: ['node14'],
        write: false,
        outdir: '__LOAR_OUTDIR'
      })
      vol.writeFileSync('/config.js', outputFiles[0].text)
      userConfig = createFsRequire(vol)('/config')
      break
    }
    default:
      throw Error(
        'The configuration file used an unsupported file or path error'
      )
  }
  return {
    entry: normalizesEntry(defaultConfig.entry, userConfig.entry),
    webpackConfig: userConfig.webpackConfig
  }
}

function normalizesEntry(
  configL: UserConfig['entry'],
  configH: UserConfig['entry']
): UserConfig['entry'] {
  let entry = configL
  if (configH) {
    if (isString(configH)) {
      entry = path.isAbsolute(configH)
        ? configH
        : path.join(process.cwd(), configH)
    } else if (isObject(configH)) {
      entry = {}
      Object.entries(configH).forEach(([key, val]) => {
        ;(<ObjectWithAnyKey>entry)[key] = path.isAbsolute(val)
          ? val
          : path.join(process.cwd(), val)
      })
    } else {
      throw Error('wrong type of entry property')
    }
  }
  return entry
}
