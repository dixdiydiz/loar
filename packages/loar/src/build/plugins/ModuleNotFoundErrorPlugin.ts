import type { Compiler } from 'webpack'

export default class ModuleNotFoundErrorPlugin {
  constructor(private root: string) {
    this.root = root || process.cwd()
    this.supplementError = this.supplementError.bind(this)
  }
  apply(compiler: Compiler) {
    const { supplementError } = this
    compiler.resolverFactory.hooks.resolver
      .for('normal')
      .tap('ModuleNotFoundErrorPlugin', (resolver) => {
        resolver.hooks.noResolve.tap(
          'ModuleNotFoundErrorPlugin',
          (req, err) => {
            if (err) {
              const {
                // @ts-ignore
                context: { issuer },
                request
              } = req
              supplementError(issuer, request, err)
            }
          }
        )
      })
  }
  supplementError(issuer: string, req: string | undefined, err: Error) {
    let details = [`\n- Can't resolve '${req}' in '${issuer}'`]
    if (req && /^[^(\.{1,2}\/)]/.test(req)) {
      details = details.concat([`- Make sure package: '${req}' is installed`])
    }
    err.message = details.join('\n')
  }
}
