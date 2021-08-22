import cac from 'cac'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { version } from '../package.json'
import { serveCommand } from './server/cli'
import { initConfig, CommandOptions } from './config/index'
import { buildCommand } from './build/compiler'

const cli = cac('loar')

cli
  .option('--config', ' specify the configuration file name')
  .option(
    '--staging',
    'different release stages, like development, test, production and so on.'
  )

cli
  .command('serve', 'start a develop server')
  .action(async (options: CommandOptions) => {
    process.env.MODE = 'development'
    const { merger, configfile } = await initConfig(options)

    const server = await serveCommand(merger)
    chokidar.watch(configfile).on('change', () => {
      console.log(
        chalk.bgGreenBright(
          'configuration file has been changed, ' +
            'you should restart the server'
        )
      )
    })
    ;['SIGINT', 'SIGTERM'].forEach((sig) =>
      process.on(sig, () => {
        console.error(chalk.red('server stopped.'))
        server.close()
        process.exit()
      })
    )
  })
cli
  .command('build', 'build project form production')
  .option('--progress', 'prints progress messages to stderr')
  .action(async (options: CommandOptions) => {
    process.env.MODE = 'production'
    const { merger } = await initConfig(options)
    buildCommand(merger).catch((err) => {
      console.error(chalk.red(err))
    })
  })

cli.on('command:*', () => {
  console.error('Invalid command: %s', cli.args.join(' '))
  process.exit(1)
})
cli.version(version)
cli.help()

cli.parse()
