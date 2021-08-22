import path from 'path'
import fs from 'fs'
import webpack, { Configuration as WebpackConfig, RuleSetRule } from 'webpack'
import { SyncWaterfallHook } from 'tapable'
import type { Options as HtmlWebpackPluginOptions } from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import ModuleNotFoundErrorPlugin from '../build/plugins/ModuleNotFoundErrorPlugin'
import { setDotenv, EnvOptions, EnvPlugin } from '../build/plugins/EnvPlugin'
import {
  combineRules,
  combineSwcLoaderOptions,
  htmlWebpackPluginWrapper
} from './webpackConfigHelper'
import { CommandOptions } from './index'
import { isArray, isObject, isString } from '../utils'
import { InterpolateHtmlEnvPlugin } from '../build/plugins/InterpolateHtmlEnvPlugin'

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
  [index: string]: any
}

type FieldPlugin = { apply: (arg: HooksContext) => void }

export interface ExtendedConfig {
  /**
   * root path, default process.cwd()
   */
  rootPath?: string
  /**
   * the directory where the directly copied file is located
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
   * html-webpack-plugin options
   */
  htmlOptions?: HtmlWebpackPluginOptions
  /**
   *
   */
  css?: CssOptions
  /**
   * swc loader options
   */
  swcLoaderOptions?: { [index: string]: any }
  /**
   * loar special plugins
   */
  fieldPlugins?: FieldPlugin[]
  /**
   * dotenv config
   */
  envOptions?: EnvOptions
}

export type UserConfig = WebpackConfig &
  ExtendedConfig & {
    devServer?: DevServer
  }
type OneOffConfig = Pick<CommandOptions, 'staging'>

interface HooksContext {
  resolve: SyncWaterfallHook<unknown>
}

export class ConfigMerger {
  readonly isProductionMode: boolean
  readonly hooksContext: HooksContext
  private rootPath = process.cwd()
  publicPath = ''
  resolvedConfig: UserConfig = {}
  oneOffConfig: OneOffConfig = {}
  webpackConfig: WebpackConfig = {}
  swcLoaderOptions = {}
  parsedEnv: Record<string, any> = {}
  templateFile = ''

  constructor(readonly mode: WebpackConfig['mode']) {
    this.mode = ['development', 'production'].includes(mode as string)
      ? mode
      : 'production'
    this.isProductionMode = mode === 'production'
    this.hooksContext = {
      resolve: new SyncWaterfallHook<UserConfig>(['config'])
    }
  }
  setConfig(config: UserConfig, oneOffConfig: OneOffConfig) {
    if (!isObject(config)) {
      throw Error('configuration format error')
    }
    this.resolvedConfig = config
    this.oneOffConfig = oneOffConfig
    const {
      rootPath = '',
      publicPath = '',
      swcLoaderOptions = {}
    } = this.resolvedConfig
    this.rootPath = rootPath ? fs.realpathSync(rootPath) : process.cwd()
    this.publicPath = path.isAbsolute(publicPath)
      ? publicPath
      : path.resolve(this.rootPath, 'public')
    this.swcLoaderOptions = swcLoaderOptions
    this.handleEnvOptions().registerHooks().hybrid()
    this.callResolveHook()
    return this
  }
  registerHooks() {
    const plugins = this.resolvedConfig.fieldPlugins
    if (isArray(plugins)) {
      const resolvePlugins = plugins.filter((ele) => 'apply' in ele)
      resolvePlugins.forEach((plugin) => plugin.apply(this.hooksContext))
    }
    return this
  }
  callResolveHook() {
    const resolvedConfig = this.hooksContext.resolve.call(this.resolvedConfig)
    if (!isObject(resolvedConfig)) {
      throw Error('resolve hook should return the legal configuration object')
    }
    this.resolvedConfig = resolvedConfig as UserConfig
    return this
  }
  handleEnvOptions() {
    const { staging } = this.oneOffConfig
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
                : path.resolve(this.rootPath, userEnvOptions.dir)
            }
          : {
              dir: this.rootPath
            }
      )
      this.parsedEnv = setDotenv(staging, envOptions, {
        PUBLIC_DIR: this.publicPath
      })
    }
    return this
  }
  assignDevServer() {
    this.resolvedConfig.devServer = Object.assign(
      {},
      {
        host: process.env.HOST || '0.0.0.0',
        port: Number(process.env.PORT) || 8000
      },
      this.resolvedConfig?.devServer
    )
    return this
  }
  assignOutpout() {
    const defaultOption: { [key in keyof WebpackConfig['output']]: any } = {
      path: this.isProductionMode
        ? path.resolve(this.rootPath, 'dist')
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
    // @ts-ignore
    // @ts-ignore
    this.resolvedConfig.optimization = {
      minimize: this.isProductionMode,
      ...this.resolvedConfig.optimization,
      minimizer: [
        '...',
        ...(this.resolvedConfig.optimization?.minimizer || [])
      ],
      splitChunks: Object.assign(
        {},
        {
          chunks: 'all',
          name: !this.isProductionMode
        },
        this.resolvedConfig.optimization?.splitChunks ?? undefined,
        {
          cacheGroups: Object.assign(
            {},
            {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendor',
                chunks: 'all'
              }
            },
            this.resolvedConfig.optimization?.splitChunks &&
              isObject(
                this.resolvedConfig.optimization?.splitChunks?.cacheGroups
              )
              ? this.resolvedConfig.optimization?.splitChunks?.cacheGroups
              : undefined
          )
        }
      ),
      runtimeChunk: {
        name: (entrypoint: { name: any }) => `runtime-${entrypoint.name}`
      }
    }
    return this
  }
  assignResolve() {
    const defaultModules = [path.resolve(this.rootPath, 'src'), '...']
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
        test: /\.m?jsx?$/,
        exclude: /(node_modules|lib)/,
        use: {
          loader: require.resolve('swc-loader'),
          options: combineSwcLoaderOptions(this.swcLoaderOptions, {
            syntax: 'ecmascript'
          })
        }
      },
      {
        test: /\.tsx?$/,
        exclude: /(node_modules|lib)/,
        use: {
          loader: require.resolve('swc-loader'),
          options: combineSwcLoaderOptions(this.swcLoaderOptions, {
            syntax: 'typescript'
          })
        }
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
      htmlWebpackPluginWrapper(this),
      new ModuleNotFoundErrorPlugin(this.rootPath),
      new EnvPlugin(),
      new InterpolateHtmlEnvPlugin(),
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
        : (this.resolvedConfig.sourceMapOnProduction ?? true) && 'source-map'
    }
    this.resolvedConfig = Object.assign({}, this.resolvedConfig, defaultOption)
    return this
  }
  produceCssLoader() {
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
    type IgnoreKeys = {
      [k in keyof Required<ExtendedConfig>]: unknown
    }
    const ignoreKeys: IgnoreKeys = {
      rootPath: true,
      publicPath: true,
      progress: true,
      sourceMapOnProduction: true,
      htmlOptions: true,
      css: true,
      swcLoaderOptions: true,
      fieldPlugins: true,
      envOptions: true
    }
    this.webpackConfig = Object.keys(this.resolvedConfig).reduce<WebpackConfig>(
      (prev, curr) => {
        if (!ignoreKeys[curr as keyof IgnoreKeys]) {
          // @ts-ignore
          prev[curr] = this.resolvedConfig[curr]
        }
        return prev
      },
      {}
    )
    return this.webpackConfig
  }
}

export default ConfigMerger
