import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { DefinePlugin } from 'webpack'
import type { Compiler } from 'webpack'
import { isObject } from '../../utils'

export interface EnvOptions {
  /**
   * The directory where the file is located
   */
  dir: string
  /**
   * Env variables starts with prefix
   */
  prefix?: string
}

export const parsedEnv = Object.create(null)
let override: boolean

export function setDotenv(
  phase: string,
  option: EnvOptions,
  extra?: Record<string, any>
): typeof parsedEnv {
  const { prefix = 'APP_' } = option
  const files = ['.env', '.env.local', `.env.${phase}`, `.env.${phase}.local`]
  for (const file of files) {
    const filepath = path.join(option.dir, file)
    if (fs.existsSync(filepath)) {
      const envConfig = dotenv.parse(fs.readFileSync(filepath))
      for (const [key, val] of Object.entries(envConfig)) {
        if (key.startsWith(prefix)) {
          parsedEnv[key] = interpolate(val)
        }
      }
    }
  }
  if (isObject(extra)) {
    for (const [key, val] of Object.entries(extra!)) {
      parsedEnv[key] = val
    }
  }
  return parsedEnv
  // Mostly taken from here: https://github.com/motdotla/dotenv-expand/blob/master/lib/main.js#L7
  function interpolate(envValue: string): string {
    const matches = envValue.match(/(.?\${?(?:[a-zA-Z0-9_]+)?}?)/g)
    if (Array.isArray(matches)) {
      return matches.reduce((newEnv, match) => {
        const parts = /(.?)\${?([a-zA-Z0-9_]+)?}?/g.exec(match)
        const prefix = parts![1]
        let value, replacePart

        if (prefix === '\\') {
          replacePart = parts![0]
          value = replacePart.replace('\\$', '$')
        } else {
          const key = parts![2]
          replacePart = parts![0].substring(prefix.length)
          value = parsedEnv[key] || ''
          value = interpolate(value)
        }

        return newEnv.replace(replacePart, value)
      }, envValue)
    }
    return envValue
  }
}

export class ImportMetaEnv {
  apply(compiler: Compiler) {
    const data = this.formatData({
      ...parsedEnv
    })
    new DefinePlugin(data).apply(compiler)
  }
  formatData(data: Record<string, any>): Record<string, any> {
    return Object.entries(data).reduce<Record<string, any>>(
      (formatted, [key, val]) => {
        const transformVal = JSON.stringify(process.env[key] || val)
        formatted[`import.meta.env.${key}`] = transformVal
        return formatted
      },
      {}
    )
  }
}
