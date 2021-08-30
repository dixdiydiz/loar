import { HooksContext } from 'loar'
export default class NotifyEntry {
  apply({ resolve }: HooksContext) {
    resolve.tap('NotifyEntry', (config) => {
      config.entry = './src/index.js'
      return config
    })
  }
}
