// import path from 'path'
// import HtmlWebpackPlugin, {
//   Options as HtmlWebpackPluginOptions
// } from 'html-webpack-plugin'
// import type { Compiler, Compilation } from 'webpack'
//
// export function htmlWebpackPluginWrap(options: HtmlWebpackPluginOptions = {}) {
//   return new HtmlWebpackPlugin(
//     Object.assign(
//       {},
//       {
//         inject: true,
//         template: path.join(this.publicPath, './index.html')
//       },
//       this.isProductionMode
//         ? {
//             minify: {
//               removeComments: true,
//               collapseWhitespace: true,
//               removeRedundantAttributes: true,
//               useShortDoctype: true,
//               removeEmptyAttributes: true,
//               removeStyleLinkTypeAttributes: true,
//               keepClosingSlash: true,
//               minifyJS: true,
//               minifyCSS: true,
//               minifyURLs: true
//             }
//           }
//         : undefined,
//       this.resolvedConfig.htmlOptions
//         ? {
//             ...this.resolvedConfig.htmlOptions
//           }
//         : {}
//     )
//   )
// }
//
// export class InterpolateHtmlEnvPlugin {
//   apply(compiler: Compiler) {
//     compiler.hooks.compilation.tap(
//       'InterpolateHtmlEnvPlugin',
//       (compilation: Compilation) => {
//         HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(
//           'InterpolateHtmlEnvPlugin',
//           async (data, cb) => {
//             // Manipulate the content
//             data.html += 'The Magic Footer'
//             // Tell webpack to move on
//             cb(null, data)
//           }
//         )
//       }
//     )
//   }
// }
//
module.exports = MyPlugin
// export default htmlWebpackPluginWrap
