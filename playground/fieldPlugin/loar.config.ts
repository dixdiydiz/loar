import * as path from 'path'
import NotifyEntry from './notifyEntry'

export default {
  // non-existent file
  entry: 'notn-existent.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: ''
  },
  fieldPlugins: [new NotifyEntry()]
}
