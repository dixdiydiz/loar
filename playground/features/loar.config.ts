import path from 'path'
import { HtmlWebpackPlugin } from 'loar'

export default {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: ''
  },
  resolve: {
    alias: {
      '@pages': path.join(__dirname, 'src/pages')
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'test.html',
      templateContent: `
    <html>
      <body>
        <h1>Hello World</h1>
      </body>
    </html>
  `
    })
  ]
}
