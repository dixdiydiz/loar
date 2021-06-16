import cac from 'cac'
import { version } from '../package.json'

const cli = cac('loar')

cli.command('start', 'start a develop server').action(() => {
  console.log('aaaa')
  console.log('aaaa')
})

cli.on('command:*', () => {
  console.error('Invalid command: %s', cli.args.join(' '))
  process.exit(1)
})
cli.version(version)
cli.help()

cli.parse()
