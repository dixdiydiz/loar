import type { RuleSetRule } from 'webpack'
import HtmlWebpackPlugin, {
  Options as HtmlWebpackPluginOptions
} from 'html-webpack-plugin'
import { isArray, isFunction, isObject } from '../utils'
import path from 'path'
import ConfigMerger from './configMerger'

export function combineRules(
  rules: RuleSetRule[],
  insertRules: unknown
): RuleSetRule[] {
  if (isArray(insertRules)) {
    for (const rule of insertRules) {
      const { use, test } = rule
      const found = rules.find(({ test: t }) => String(t) === String(test))
      if (found) {
        const foundUse = isArray(found.use)
          ? found.use
          : [{ loader: found.loader, options: found.options }]
        const rewriteUse = [
          ...(isArray(use)
            ? use
            : [{ loader: found.loader, options: found.options }]),
          ...foundUse
        ]
        Object.assign(found, rule, { use: rewriteUse })
      } else {
        rules.push(rule)
      }
    }
  }
  return rules
}

export function htmlWebpackPluginOptions(
  configMerger: ConfigMerger
): HtmlWebpackPlugin {
  const templateParameters = handleTemplateParameters(
    configMerger?.resolvedConfig?.htmlOptions?.templateParameters,
    configMerger
  )
  return new HtmlWebpackPlugin(
    Object.assign(
      {},
      {
        inject: true,
        template: path.join(configMerger.publicPath, './index.html')
      },
      configMerger.isProductionMode
        ? {
            minify: {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true
            }
          }
        : undefined,
      configMerger.resolvedConfig.htmlOptions
        ? {
            ...configMerger.resolvedConfig.htmlOptions
          }
        : undefined,
      { templateParameters }
    )
  )
  function handleTemplateParameters(
    params: any,
    configMerger: ConfigMerger
  ): any {
    // cover
    const parsedEnv = Object.assign({}, configMerger.parsedEnv, {
      PUBLIC_DIR: ''
    })
    if (isFunction(params)) {
      return (compilation: any, assets: any, assetTags: any, options: any) => {
        let result = params(compilation, assets, assetTags, options)
        if (isObject(result)) {
          result = {
            ...parsedEnv,
            ...result
          }
        }
        return result
      }
    } else if (isObject(params) || params == void 0) {
      return Object.assign({}, parsedEnv, params)
    }
    return params
  }
}
