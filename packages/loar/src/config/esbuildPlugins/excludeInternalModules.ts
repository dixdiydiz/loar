import { Plugin } from 'esbuild'
const excludeInternalModules: Plugin = {
  name: 'excludeInternalModules',
  setup(build) {
    build.onResolve({ filter: /^loar$/ }, (args) => {
      return { path: args.path, external: true }
    })
  }
}

export default excludeInternalModules
