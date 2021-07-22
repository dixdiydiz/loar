import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { DefinePlugin } from 'webpack'
import type { Compiler } from 'webpack'
import { isObject } from '../../utils'

export interface EnvOptions {
  dir?: string
  ignoreProcessEnv?: boolean
  override?: false
}

export const parsedEnv = Object.create(null)
let override: boolean

export function setDotenv(
  staging: string,
  option: Required<EnvOptions>,
  extra?: Record<string, any>
): typeof parsedEnv {
  const startFlag = 'APP_'
  const files = [
    '.env',
    '.env.local',
    `.env.${staging}`,
    `.env.${staging}.local`
  ]
  const { ignoreProcessEnv } = option
  override = option.override
  for (const file of files) {
    const filepath = path.join(option.dir, file)
    if (fs.existsSync(filepath)) {
      const envConfig = dotenv.parse(fs.readFileSync(filepath))
      for (const [key, val] of Object.entries(envConfig)) {
        if (key.startsWith(startFlag)) {
          const envVal = interpolate(val)
          parsedEnv[key] = envVal
          if (!ignoreProcessEnv) process.env[key] = envVal
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
}

// Mostly taken from here: https://github.com/motdotla/dotenv-expand/blob/master/lib/main.js#L7
function interpolate(envValue: string): string {
  const matches = envValue.match(/(.?\${?(?:[a-zA-Z0-9_]+)?}?)/g) || []
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

export class EnvPlugin {
  private override: boolean
  constructor() {
    this.override = override
  }

  apply(compiler: Compiler) {
    const data = this.formatData({
      ...parsedEnv
    })
    new DefinePlugin(data).apply(compiler)
  }
  formatData(data: Record<string, any>): Record<string, any> {
    return Object.entries(data).reduce<Record<string, any>>(
      (formatted, [key, val]) => {
        const transformVal = JSON.stringify(
          this.override ? val : process.env[key] || val
        )
        formatted[`process.env.${key}`] = transformVal
        formatted[`import.meta.env.${key}`] = transformVal
        return formatted
      },
      {}
    )
  }
}
