// @ts-ignore
import { globbySync } from 'globby'

export interface Route {
  path: string
  element: string
  children?: Route[]
}

export default function (
  root: string,
  routeMatch?: string[],
  exclude?: string[]
) {
  routeMatch = Array.isArray(routeMatch)
    ? routeMatch
    : typeof routeMatch === 'string'
    ? [routeMatch]
    : ['**/*.{js,jsx,ts,tsx}']
  exclude = Array.isArray(exclude)
    ? exclude
    : typeof exclude === 'string'
    ? [exclude]
    : ['**/__tests__/**']
  const routes: Route[] = []
  const paths = globbySync(
    [...routeMatch, ...exclude.map((str) => `!${str}`)],
    {
      cwd: root,
      onlyFiles: false
    }
  )
  return routes
}
