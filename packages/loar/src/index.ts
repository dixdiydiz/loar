import cac from 'cac'
import { version } from '../package.json'
import { initConfig } from './config'
import { createServerContext } from './server/cli'

const cli = cac('loar')

cli
  .command('start', 'start a develop server')
  .option('--config', ' specify the configuration file name')
  .action(async (options) => {
    process.env.MODE = 'development'
    const { config: specifiedFile } = options
    const config = await initConfig({
      configfile: specifiedFile
    })
    console.log(JSON.stringify(config))
    createServerContext({
      devConfig: config.config.devServer!,
      webapckConfig: config.webpack
    })
  })

cli.on('command:*', () => {
  console.error('Invalid command: %s', cli.args.join(' '))
  process.exit(1)
})
cli.version(version)
cli.help()

cli.parse()
