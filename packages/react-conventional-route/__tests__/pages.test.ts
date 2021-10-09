import * as path from 'path'
import routes from '../index'

describe('routes', () => {
  it('no limits', () => {
    expect(routes(path.resolve(__dirname, './pages'))).toEqual([
      { element: `${__dirname}/pages/index.route.js`, path: '/' },
      { element: `${__dirname}/pages/about/index.route.js`, path: 'about' },
      { element: `${__dirname}/pages/about/[id].route.js`, path: 'about/:id' },
      {
        children: [
          { element: `${__dirname}/pages/about/deep/404.route.js`, path: '*' }
        ],
        element: `${__dirname}/pages/about/deep/_index.route.js`,
        path: 'about/deep/*'
      },
      {
        element: `${__dirname}/pages/users/_index.route.js`,
        path: 'users/*',
        children: [
          { element: `${__dirname}/pages/users/[id].route.js`, path: ':id' },
          { element: `${__dirname}/pages/users/dont.special.js`, path: 'dont' },
          {
            element: `${__dirname}/pages/users/[serial]/[id].route.js`,
            path: ':serial/:id'
          },
          {
            element: `${__dirname}/pages/users/deep/level.route.js`,
            path: 'deep/level'
          },
          {
            element: `${__dirname}/pages/users/deep/404.route.js`,
            path: 'deep/*'
          }
        ]
      },
      { element: `${__dirname}/pages/404.route.js`, path: '*' }
    ])
  })
  it('routeMatch for .route', () => {
    expect(
      routes(path.resolve(__dirname, './pages'), ['**/*.route.{js,jsx,ts,tsx}'])
    ).toEqual([
      { element: `${__dirname}/pages/index.route.js`, path: '/' },
      { element: `${__dirname}/pages/about/index.route.js`, path: 'about' },
      { element: `${__dirname}/pages/about/[id].route.js`, path: 'about/:id' },
      {
        children: [
          { element: `${__dirname}/pages/about/deep/404.route.js`, path: '*' }
        ],
        element: `${__dirname}/pages/about/deep/_index.route.js`,
        path: 'about/deep/*'
      },
      {
        element: `${__dirname}/pages/users/_index.route.js`,
        path: 'users/*',
        children: [
          { element: `${__dirname}/pages/users/[id].route.js`, path: ':id' },
          {
            element: `${__dirname}/pages/users/[serial]/[id].route.js`,
            path: ':serial/:id'
          },
          {
            element: `${__dirname}/pages/users/deep/level.route.js`,
            path: 'deep/level'
          },
          {
            element: `${__dirname}/pages/users/deep/404.route.js`,
            path: 'deep/*'
          }
        ]
      },
      { element: `${__dirname}/pages/404.route.js`, path: '*' }
    ])
  })
  it('routeMatch for .special', () => {
    expect(
      routes(path.resolve(__dirname, './pages'), [
        '**/*.special.{js,jsx,ts,tsx}'
      ])
    ).toEqual([
      {
        element: `${__dirname}/pages/users/dont.special.js`,
        path: 'users/dont'
      }
    ])
  })
})
