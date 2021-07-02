import path from 'path'
import fs from 'fs'
import webpack, { Configuration as WebpackConfig, RuleSetRule } from 'webpack'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import { SyncWaterfallHook } from 'tapable'
import type { Options as ProxyOptions } from 'http-proxy-middleware'
import HtmlWebpackPlugin, {
  Options as HtmlWebpackPluginOptions
} from 'html-webpack-plugin'
import ModuleNotFoundErrorPlugin from '../build/plugins/ModuleNotFoundErrorPlugin'
import { assignRules } from './webpackConfigHelper'
import { isObject, isString } from '../utils'

type FieldPlugin = { preApply: (arg: HooksContext) => void }

interface cssOptions {
  loaderOptions?: any
}

export interface DevServer {
  https?: boolean
  host?: string
  port?: number
  proxy?: {
    [index: string]: ProxyOptions
  }
}
export interface ExtendedConfig {
  /**
   * root path, default process.cwd()
   */
  rootPath?: string
  /**
   * public path
   */
  publicPath?: string
  /**
   * progress
   */
  progress?: boolean
  /**
   * force use sourcemap in development
   */
  sourceMapOnProduction?: boolean
  /**
   * server configuration
   */
  devServer?: DevServer
  /**
   * html-webpack-plugin options
   */
  htmlOptions?: HtmlWebpackPluginOptions
  /**
   *
   */
  css?: cssOptions
  /**
   * esbuild loader option
   */
  esbuildLoaderOptions?: { [index: string]: any }
  /**
   * loar special plugins
   */
  fieldPlugins?: FieldPlugin[]
}

export type UserConfig = WebpackConfig & ExtendedConfig

interface HooksContext {
  hooks: {
    readonly resolveConfig: SyncWaterfallHook<unknown>
  }
}

export class ConfigMerger {
  readonly isProductionMode: boolean
  readonly hooksContext: HooksContext
  private rootpath: string
  private publicPath: string
  resolvedConfig: UserConfig = {}
  webpackConfig: WebpackConfig = {}
  esbuildLoaderOptions = {}

  constructor(readonly mode: WebpackConfig['mode']) {
    this.mode = ['development', 'production'].includes(mode as string)
      ? mode
      : 'production'
    this.isProductionMode = mode === 'production'
    this.rootpath = process.cwd()
    this.publicPath = path.resolve(process.cwd(), 'public')
    this.hooksContext = {
      hooks: this.constructHooks()
    }
  }
  setConfig(config: UserConfig, autoAssign = false) {
    if (!isObject(config)) {
      throw Error('configuration format error')
    }
    this.resolvedConfig = config
    if (isString(config.rootPath)) {
      this.rootpath = fs.realpathSync(config.rootPath)
    }
    if (isString(config.publicPath)) {
      const publicpath = config.publicPath
      this.publicPath = path.isAbsolute(publicpath)
        ? publicpath
        : path.resolve(this.rootpath, publicpath)
    }
    if (config.esbuildLoaderOptions) {
      this.esbuildLoaderOptions = {
        target: 'es2015',
        ...config.esbuildLoaderOptions
      }
    }
    if (autoAssign) {
      this.runAssign()
    }
    return this
  }
  constructHooks() {
    const hooks = {
      resolveConfig: new SyncWaterfallHook<UserConfig>(['config'])
    }
    return hooks
  }
  registerHooks() {
    ;(this.resolvedConfig.fieldPlugins || [])
      .filter((plugin) => 'preApply' in plugin)
      .forEach((plugin) => plugin.preApply(this.hooksContext))
  }
  resolveConfigHook() {
    this.hooksContext.hooks.resolveConfig.call(this.resolvedConfig)
  }
  assignDevServer() {
    const defaultDevServer = {
      host: process.env.HOST || '0.0.0.0',
      port: Number(process.env.PORT) || 8000
    }
    this.resolvedConfig.devServer = Object.assign(
      {},
      defaultDevServer,
      this.resolvedConfig?.devServer
    )
    return this
  }
  assignOutpout() {
    const defaultOption: { [key in keyof WebpackConfig['output']]: any } = {
      path: this.isProductionMode
        ? path.resolve(this.rootpath, 'dist')
        : undefined,
      filename: '[name].[contenthash:8].js',
      chunkFilename: '[name].[contenthash:8].chunk.js'
    }
    this.resolvedConfig.output = {
      ...defaultOption,
      ...this.resolvedConfig.output
    }
    return this
  }
  assignOptimization() {
    const defaultMinimizer: any[] = this.isProductionMode
      ? [new CssMinimizerPlugin()]
      : []
    const defaultOption: { [key in keyof WebpackConfig['optimization']]: any } =
      {
        minimize: this.isProductionMode
      }
    this.resolvedConfig.optimization = {
      ...defaultOption,
      ...this.resolvedConfig.optimization,
      minimizer: [
        '...',
        ...defaultMinimizer,
        ...(this.resolvedConfig.optimization?.minimizer || [])
      ]
    }
    return this
  }
  assignResolve() {
    const defaultModules = [path.resolve(this.rootpath, 'src'), '...']
    const defaultExtensions = ['.jsx', '.tsx', '...']

    this.resolvedConfig.resolve = {
      ...this.resolvedConfig.resolve,
      modules: [
        ...defaultModules,
        ...(this.resolvedConfig.resolve?.modules || [])
      ],
      extensions: [
        ...defaultExtensions,
        ...(this.resolvedConfig.resolve?.extensions || [])
      ]
    }
    return this
  }
  assignModule() {
    const defaultRules: RuleSetRule[] = [
      {
        test: /.jsx?$/,
        use: [
          {
            loader: 'esbuild-loader',
            options: { loader: 'jsx', ...this.esbuildLoaderOptions }
          }
        ]
      },
      {
        test: /.tsx?$/,
        use: [
          {
            loader: 'esbuild-loader',
            options: { loader: 'tsx', ...this.esbuildLoaderOptions }
          }
        ]
      }
    ]
    this.resolvedConfig.module = {
      rules: assignRules(defaultRules, this.resolvedConfig?.module?.rules),
      ...this.resolvedConfig.module
    }
    return this
  }
  assignPlugins() {
    const optionalPlugins = [
      this.resolvedConfig.progress &&
        new webpack.ProgressPlugin({
          activeModules: false,
          entries: true,
          handler(percentage, message, ...args) {
            console.info(percentage, message, ...args)
          },
          modules: true,
          modulesCount: 5000,
          profile: false,
          dependencies: true,
          dependenciesCount: 10000,
          percentBy: null
        })
    ].filter(Boolean) as WebpackConfig['plugins']
    this.resolvedConfig.plugins = [
      new HtmlWebpackPlugin(
        Object.assign(
          {},
          {
            inject: true,
            template: path.join(this.publicPath, './index.html')
          },
          this.isProductionMode
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
          this.resolvedConfig.htmlOptions || undefined
        )
      ),
      new ModuleNotFoundErrorPlugin(this.rootpath),
      ...optionalPlugins!,
      ...(this.resolvedConfig.plugins || [])
    ]
    return this
  }
  assignChore() {
    const defaultOption: { [key in keyof WebpackConfig]: any } = {
      mode: this.mode,
      bail: this.isProductionMode,
      devtool: !this.isProductionMode
        ? 'eval-cheap-module-source-map'
        : this.resolvedConfig.sourceMapOnProduction && 'source-map'
    }
    Object.assign(this.resolvedConfig, defaultOption)
    return this
  }
  runAssign() {
    this.assignOutpout()
      .assignResolve()
      .assignModule()
      .assignPlugins()
      .assignOptimization()
      .assignChore()
      .assignDevServer()
    return this
  }
  cleanWebpackConfig() {
    type IgnoreKeys = keyof Required<ExtendedConfig>
    const ignoreKeys: IgnoreKeys[] = [
      'devServer',
      'sourceMapOnProduction',
      'htmlOptions',
      'esbuildLoaderOptions',
      'rootPath',
      'publicPath',
      'progress'
    ]
    Object.entries(this.resolvedConfig).forEach(([key, val]) => {
      if (!ignoreKeys.includes(<IgnoreKeys>key)) {
        // @ts-ignore
        this.webpackConfig[key] = val
      }
    })
    return this.webpackConfig
  }
}

export default ConfigMerger
