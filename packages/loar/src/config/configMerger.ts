import path from 'path'
import fs from 'fs'
import webpack, { Configuration as WebpackConfig, RuleSetRule } from 'webpack'
import { SyncWaterfallHook } from 'tapable'
import type { Options as ProxyOptions } from 'http-proxy-middleware'
import type { Options as HtmlWebpackPluginOptions } from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import ModuleNotFoundErrorPlugin from '../build/plugins/ModuleNotFoundErrorPlugin'
import { setDotenv, EnvOptions, EnvPlugin } from '../build/plugins/EnvPlugin'
import { combineRules } from './webpackConfigHelper'
import { CommandOptions } from './index'
import { isObject, isString } from '../utils'

type LoaderOptions = Partial<
  Record<
    | `${'css' | 'sass' | 'less' | 'style' | 'stylus' | 'postcss'}-loader`
    | 'css-extract',
    any
  >
>
interface CssOptions extends LoaderOptions {
  extract?: boolean | Record<string, any>
  sourceMap?: boolean
  moduleExtension?: boolean | string
}

export interface DevServer {
  https?: boolean
  host?: string
  port?: number
  proxy?: {
    [index: string]: ProxyOptions
  }
}

type FieldPlugin = { preApply: (arg: HooksContext) => void }

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
  css?: CssOptions
  /**
   * esbuild loader option
   */
  esbuildLoaderOptions?: { [index: string]: any }
  /**
   * loar special plugins
   */
  fieldPlugins?: FieldPlugin[]
  /**
   * dotenv config
   */
  envOptions?: EnvOptions
}

export type UserConfig = WebpackConfig & ExtendedConfig
type OtherConfig = Pick<CommandOptions, 'staging'>

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
  otherConfig: OtherConfig = {}
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
  setConfig(config: UserConfig, otherConfig: OtherConfig, autoAssign = false) {
    if (!isObject(config)) {
      throw Error('configuration format error')
    }
    this.resolvedConfig = config
    this.otherConfig = otherConfig
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
    this.handleEnvOptions()
    if (autoAssign) {
      this.hybrid()
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
  handleEnvOptions() {
    const { staging } = this.otherConfig
    const { envOptions: userEnvOptions } = this.resolvedConfig
    if (staging) {
      const envOptions = Object.assign(
        {},
        {
          ignoreProcessEnv: true,
          override: true
        },
        userEnvOptions
          ? {
              ...userEnvOptions
            }
          : undefined,
        userEnvOptions?.dir
          ? {
              dir: path.isAbsolute(userEnvOptions.dir)
                ? userEnvOptions.dir
                : path.resolve(this.rootpath, userEnvOptions.dir)
            }
          : {
              dir: this.rootpath
            }
      )
      setDotenv(staging, envOptions, {
        PUBLIC_DIR: this.publicPath
      })
    }
    return this
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
    const defaultMinimizer: any[] = []
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
    const jsRules: RuleSetRule[] = [
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
    const assetRules = [
      {
        test: /\.(png|jpg|gif)$/i,
        oneOf: [
          {
            resourceQuery: /inline/, // ?inline
            type: 'asset/inline'
          },
          {
            type: 'asset/resource' // default
          }
        ]
      },
      {
        test: /\.svg$/i,
        oneOf: [
          {
            resourceQuery: /inline/, // ?inline
            type: 'asset/inline'
          },
          {
            type: 'asset/resource' // default
          }
        ]
      },
      {
        test: /\.txt/,
        type: 'asset' // a file with size less than 8kb will be treated as a inline module type and resource module type otherwise.
      }
    ]
    const cssRules = this.produceCssLoader()
    this.resolvedConfig.module = {
      ...this.resolvedConfig.module,
      rules: [
        ...combineRules(
          [...jsRules, ...assetRules],
          this.resolvedConfig?.module?.rules
        ),
        ...combineRules(cssRules, this.resolvedConfig?.module?.rules)
      ]
    }
    return this
  }
  assignPlugins() {
    const { extract: useMiniCssExtractPlugin = this.isProductionMode } =
      this.resolvedConfig?.css || {}
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
        }),
      this.isProductionMode &&
        useMiniCssExtractPlugin &&
        new MiniCssExtractPlugin()
    ].filter(Boolean) as WebpackConfig['plugins']
    this.resolvedConfig.plugins = [
      new ModuleNotFoundErrorPlugin(this.rootpath),
      new EnvPlugin(),
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
  produceCssLoader(): RuleSetRule[] {
    const { isProductionMode } = this
    const {
      extract = isProductionMode,
      sourceMap = false,
      moduleExtension = true,
      ...loaderOptions
    } = this.resolvedConfig?.css || {}
    const moduleAutoReg =
      moduleExtension === false
        ? undefined
        : moduleExtension === '*'
        ? new RegExp('\\.\\w+$')
        : isString(moduleExtension) && moduleExtension.length
        ? new RegExp(`\\.${moduleExtension}\\.\\w+$`)
        : new RegExp('\\.module\\.\\w+$')
    const baseLoaderOptions: BaseCssLoaderOptions = [
      'style-loader',
      'css-loader',
      'css-extract'
    ].reduce((res, key) => {
      res[key as keyof BaseCssLoaderOptions] = Object.assign(
        {},
        key !== 'css-extract' ? { sourceMap } : undefined,
        loaderOptions[key as keyof BaseCssLoaderOptions],
        key === 'css-loader' && moduleAutoReg
          ? {
              modules: {
                auto: moduleAutoReg,
                localIdentName: '[path][name]__[local]--[hash:base64:5]'
              }
            }
          : undefined
      )
      return res as BaseCssLoaderOptions
    }, {} as BaseCssLoaderOptions)

    return [
      {
        test: /\.css$/i,
        use: getBaseCssLoader(baseLoaderOptions)
      },
      {
        test: /\.s[ca]ss$/i,
        use: [
          ...getBaseCssLoader(baseLoaderOptions),
          {
            loader: 'resolve-url-loader',
            options: { sourceMap }
          },
          {
            loader: 'sass-loader',
            options: Object.assign(
              {},
              { sourceMap },
              loaderOptions['sass-loader']
            )
          }
        ]
      },
      {
        test: /\.less$/i,
        use: [
          ...getBaseCssLoader(baseLoaderOptions),
          {
            loader: 'less-loader',
            options: Object.assign(
              {},
              { sourceMap },
              loaderOptions['less-loader']
            )
          }
        ]
      },
      {
        test: /\.styl$/i,
        use: [
          ...getBaseCssLoader(baseLoaderOptions),
          {
            loader: 'stylus-loader',
            options: Object.assign(
              {},
              { sourceMap },
              loaderOptions['less-loader']
            )
          }
        ]
      },
      {
        test: /\.sss$/i,
        use: [
          ...getBaseCssLoader(baseLoaderOptions),
          {
            loader: 'postcss-loader',
            options: Object.assign(
              {},
              { sourceMap },
              loaderOptions['postcss-loader']
            )
          }
        ]
      }
    ]

    type BaseCssLoaderOptions = Pick<
      LoaderOptions,
      'style-loader' | 'css-loader' | 'css-extract'
    >
    function getBaseCssLoader(options: BaseCssLoaderOptions): RuleSetRule[] {
      return [
        isProductionMode && extract
          ? {
              loader: MiniCssExtractPlugin.loader,
              options: Object.assign({}, options['css-extract'])
            }
          : {
              loader: 'style-loader',
              options: Object.assign({}, options['style-loader'])
            },
        {
          loader: 'css-loader',
          options: Object.assign({}, options['css-loader'])
        }
      ]
    }
  }
  hybrid() {
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
