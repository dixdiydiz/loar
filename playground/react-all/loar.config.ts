import * as process from 'process'
import * as path from 'path'

export default {
  entry: './src/index.js',
  output: {
    // The build folder.
    path: path.resolve(__dirname, 'dist'),
    // Add /* filename */ comments to generated require()s in the output.
    pathinfo: process.env.MODE === 'development',
    // There will be one main bundle, and one file per asynchronous chunk.
    // In development, it does not produce real files.
    filename:
      process.env.MODE === 'production'
        ? 'static/js/[name].[contenthash:8].js'
        : 'static/js/bundle.js',
    // There are also additional JS chunk files if you use code splitting.
    chunkFilename:
      process.env.MODE === 'production'
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : 'static/js/[name].chunk.js',
    // webpack uses `publicPath` to determine where the app is being served from.
    // It requires a trailing slash, or the file assets will get an incorrect path.
    // We inferred the "public path" (such as / or /my-project) from homepage.
    // publicPath: paths.publicUrlOrPath,
    publicPath: ''
  }
}
