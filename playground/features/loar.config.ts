import path from 'path'
import { HtmlWebpackPlugin } from 'loar'

console.log(HtmlWebpackPlugin)

export default {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: ''
  }
}
