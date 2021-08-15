import HtmlWebpackPlugin from 'html-webpack-plugin'
import type { Compiler, Compilation } from 'webpack'
import { isFunction, isObject } from '../../utils'

export class InterpolateHtmlEnvPlugin {
  private HtmlWebpackPlugin: typeof HtmlWebpackPlugin
  private parsedEnv: Record<string, string>
  constructor(htmlWebpackPlugin?: typeof HtmlWebpackPlugin) {
    if (htmlWebpackPlugin) {
      this.HtmlWebpackPlugin = htmlWebpackPlugin
    } else {
      this.HtmlWebpackPlugin = HtmlWebpackPlugin
    }
    this.parsedEnv = {}
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(
      'InterpolateHtmlEnvPlugin',
      (compilation: Compilation) => {
        this.HtmlWebpackPlugin.getHooks(
          compilation
        ).beforeAssetTagGeneration.tapPromise(
          'InterpolateHtmlEnvPlugin',
          async (data) => {
            const { parsedEnv } = await import('./EnvPlugin')
            this.parsedEnv = { ...parsedEnv, PUBLIC_DIR: '' }
            return new Promise((resolve) => {
              if (data?.plugin?.options?.templateParameters) {
                const __parsedEnv = (data.plugin.options.__parsedEnv =
                  this.parsedEnv)
                const __templateParameters =
                  data.plugin.options.templateParameters
                if (isFunction(__templateParameters)) {
                  data.plugin.options.templateParameters = (
                    compilation,
                    assets,
                    assetTags,
                    options
                  ) => {
                    let parameters = __templateParameters(
                      compilation,
                      assets,
                      assetTags,
                      options
                    )
                    if (isObject(parameters)) {
                      parameters = {
                        ...__parsedEnv,
                        ...parameters
                      }
                    }
                    return parameters
                  }
                } else if (
                  isObject(__templateParameters) ||
                  __templateParameters == undefined
                ) {
                  data.plugin.options.templateParameters = {
                    ...__parsedEnv,
                    ...__templateParameters
                  }
                }
              }
              resolve(data)
            })
          }
        )
        // this.HtmlWebpackPlugin.getHooks(
        //   compilation
        // ).afterTemplateExecution.tapPromise('aa', async (data) => {
        //   console.log(data)
        //   return data
        // })
      }
    )
  }
}
