import type { Configuration as WebpackConfig } from 'webpack'
import { constants as fsConstants } from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { build } from 'esbuild'
import { vol } from 'memfs'
import { createFsRequire } from 'fs-require'
import type { Options as ProxyOptions } from 'http-proxy-middleware'
import { isString, isObject } from './utils'
import type { ObjectWithAnyKey } from './types'

export interface DevServer {
  https?: boolean
  host: string
  port: number
  proxy?: {
    [index: string]: ProxyOptions
  }
}
interface BaseConfig {
  htmlEntry?: string | ObjectWithAnyKey
  devServer: Partial<DevServer>
}
export interface UserConfig extends WebpackConfig, BaseConfig {
  /**
   * never
   */
  default: never
  /**
   * will be overwritten
   */
  entry: never
}
interface Configuration {
  config: UserConfig
  webpack: WebpackConfig
  configfile: string
}
type DefaultConfig = Pick<UserConfig, 'htmlEntry' | 'devServer'>

export async function initConfig(option: {
  configfile?: string
}): Promise<Configuration> {
  const defaultConfig: DefaultConfig = {
    htmlEntry: path.resolve(process.cwd(), 'index.html'),
    devServer: {
      host: process.env.HOST || '0.0.0.0',
      port: Number(process.env.PORT) || 8000
    }
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
  const mode = process.env.MODE || 'production'
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
        define: {
          'import.meta.env.MODE': JSON.stringify(mode),
          'process.env.MODE': JSON.stringify(mode)
        },
        write: false,
        outdir: '__LOAR_OUTDIR'
      })
      vol.writeFileSync('/config.js', outputFiles[0].text)
      const original = createFsRequire(vol)('/config')
      userConfig = original.default || original
      break
    }
    default:
      throw Error(
        'The configuration file used an unsupported file or path error'
      )
  }
  userConfig = {
    ...defaultConfig,
    ...userConfig,
    htmlEntry: normalizesHtmlEntry(
      defaultConfig.htmlEntry,
      userConfig.htmlEntry
    )
  }
  return {
    config: userConfig,
    webpack: normalizesWebpackConfig(userConfig),
    configfile
  }
}

function normalizesWebpackConfig(userConfig: UserConfig): WebpackConfig {
  const ignoreKeys: (keyof BaseConfig)[] = ['htmlEntry', 'devServer']
  const config = {
    ...userConfig,
    entry: {}
  }
  ignoreKeys.forEach((key) => Reflect.deleteProperty(config, key))
  return config
}

function normalizesHtmlEntry(
  configL: UserConfig['htmlEntry'],
  configH: UserConfig['htmlEntry']
): UserConfig['htmlEntry'] {
  let htmlEntry = configL
  if (configH) {
    if (isString(configH)) {
      htmlEntry = path.isAbsolute(configH)
        ? configH
        : path.join(process.cwd(), configH)
    } else if (isObject(configH)) {
      htmlEntry = {}
      Object.entries(configH).forEach(([key, val]) => {
        ;(<ObjectWithAnyKey>htmlEntry)[key] = path.isAbsolute(val)
          ? val
          : path.join(process.cwd(), val)
      })
    } else {
      throw Error('wrong type of entry property')
    }
  }
  return htmlEntry
}
