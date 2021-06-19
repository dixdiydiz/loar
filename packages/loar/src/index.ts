import cac from 'cac'
import { version } from '../package.json'
import { initConfig } from './config'

const cli = cac('loar')

cli
  .command('start', 'start a develop server')
  .option('--config', ' specify the configuration file name')
  .action(async (options) => {
    const { config: specifiedFile } = options
    const config = await initConfig({
      configfile: specifiedFile
    })
    console.log(JSON.stringify(config))
  })

cli.on('command:*', () => {
  console.error('Invalid command: %s', cli.args.join(' '))
  process.exit(1)
})
cli.version(version)
cli.help()

cli.parse()
