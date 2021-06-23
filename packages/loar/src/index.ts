import cac from 'cac'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { version } from '../package.json'
import { serveCommand } from './server/cli'
import { initConfig } from './config'

const cli = cac('loar')

cli
  .command('serve', 'start a develop server')
  .option('--config', ' specify the configuration file name')
  .action(async (options) => {
    process.env.MODE = 'development'
    const {
      config,
      webpack: webpackConfig,
      configfile
    } = await initConfig({
      configfile: options.config
    })
    const { server, watching } = await serveCommand(config, webpackConfig)
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
        watching.close((closeErr) => {
          console.error(chalk(closeErr))
        })
        console.error(chalk.red('server stopped.'))
        server.close()
        process.exit()
      })
    )
  })

cli.on('command:*', () => {
  console.error('Invalid command: %s', cli.args.join(' '))
  process.exit(1)
})
cli.version(version)
cli.help()

cli.parse()
