import fg from 'fast-glob'
import path from 'path'

export interface Route {
  path: string
  element: string
  children?: Route[]
}

function cutoutPath(way: string): string {
  const matchs = way.match(/(?<=\[)[^\[\]]*(?=\])/g)
  if (matchs) {
    return matchs.reduce((res, curr) => `${res}${res ? '/' : ''}:${curr}`, '')
  }
  return way.split('.')[0]
}

export default function (root: string, routeMatch?: string[]): Route[] {
  routeMatch = [
    ...(Array.isArray(routeMatch)
      ? routeMatch
      : typeof routeMatch === 'string'
      ? [routeMatch]
      : ['**/*.{js,jsx,ts,tsx}']),
    '!**/__tests__/**'
  ]
  const paths = fg.sync(routeMatch!, {
    cwd: root,
    onlyFiles: true
  })
  return factory(root, '', paths)

  function factory(cwd: string, dir: string, files: string[]): Route[] {
    let wrap = false
    const routes: Route[] = []
    const deepRoutes = Object.create(null)
    let indexElement: Route | null = null
    let notFoundElement: Route | null = null
    for (const file of files) {
      if (/^_index\./.test(file)) {
        wrap = true
        indexElement = {
          path: !dir ? '/*' : `${cutoutPath(dir)}/*`,
          element: path.join(cwd, file)
        }
        continue
      }
      if (/^index\./.test(file) && !indexElement) {
        indexElement = {
          path: !dir ? '/' : cutoutPath(dir),
          element: path.join(cwd, file)
        }
        continue
      }
      if (/^404\./.test(file)) {
        notFoundElement = {
          path: !dir ? '*' : `${cutoutPath(dir)}/*`,
          element: path.join(cwd, file)
        }
        continue
      }
      if (/\//.test(file)) {
        const deepDir = file.split('/')[0]
        const deepFile = file.substring(deepDir.length + 1)
        if (deepRoutes[deepDir]) {
          deepRoutes[deepDir].push(deepFile)
        } else {
          deepRoutes[deepDir] = [deepFile]
        }
        continue
      }
      routes.push({
        path: cutoutPath(file),
        element: path.join(cwd, file)
      })
    }
    for (const [dir, files] of Object.entries(deepRoutes)) {
      routes.push(...factory(path.join(cwd, dir), dir, files as string[]))
    }
    if (wrap) {
      return [
        {
          ...indexElement,
          children: notFoundElement
            ? [...routes, { ...notFoundElement, path: '*' }]
            : [...routes]
        }
      ] as Route[]
    } else {
      return [
        indexElement,
        ...routes.map((r) => ({
          ...r,
          path: dir ? `${cutoutPath(dir)}/${r.path}` : r.path
        })),
        notFoundElement
      ].filter(Boolean) as Route[]
    }
  }
}
