import cac from 'cac'
import { version } from '../package.json'
import { serveCommand } from './server/cli'

const cli = cac('loar')

cli
  .command('serve', 'start a develop server')
  .option('--config', ' specify the configuration file name')
  .action((options) => {
    process.env.MODE = 'development'
    const { config } = options
    serveCommand({
      configfile: config
    })
  })

cli.on('command:*', () => {
  console.error('Invalid command: %s', cli.args.join(' '))
  process.exit(1)
})
cli.version(version)
cli.help()

cli.parse()
