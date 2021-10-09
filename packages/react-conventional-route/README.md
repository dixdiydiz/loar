## React Conventional Route
***
### argements
- root`required`  
Desc: root directory of the matching route.  
Type: string | string[]
- routeMatch`optional`   
Desc: which files are considered routes.  
Type: Glob | Goob[] 
Example: `["**/*.route.{js,jsx,ts,tsx}"]`  
Default: `["**/*.{js,jsx,ts,tsx}"]`
- exclude`optional`  
Desc: which files are not be considered routes.  
Type: Glob | Goob[]   
Example: `["**/__tests__/**"]`
- Default: `["**/__tests__/**"]`

### Features which does not support modified
- `_index` prefix file name in the directory.  
file name which is prefixed with index would transform to parent `<Route />`,
other same level file or directory as the child `<Route />`.  
like: `<rootDir>/pages/_index.route.tsx` --> 
```
[{
  path: '/', element: '<rootDir>/pages/_index.route.tsx',
  children: [
    { path: 'messages', element: '<rootDir>/pages/messages.route.tsx' },
   ]
}]
// you can generating following code
<Route path="/" element={<Index />}>
  <Route path="messages"  element={<Messages />} />
</Route>
```
- `index` prefix file name in the directory.    
**Do not use it with `_index` file at the same time, otherwise it will be invalid.**  
  Different from prefix `_index`, this `<Route />` as the same level as other `<Route />`.  
  like: `<rootDir>/pages/index.route.tsx` -->
```
[
  { path: '/', element: '<rootDir>/pages/index.route.tsx' },
  { path: '/messages', element: '<rootDir>/pages/messages.route.tsx' }
]
// you can generating following code
<Route path="/" element={<Index />} />
<Route path="messages"  element={<Messages />} />
```
- include `[]` as dynamic route.  
`[id]` -> `:id` See the example below.
- `404` prefix file name in the directory.
- Handling not found url.  
  like: `<rootDir>/pages/404.route.tsx` -->
```
{ path: "*", element: '<rootDir>/pages/404.route.tsx' }
```

***
### Example  
*Assuming the rules above.*
1. Only file name contains `route` will be registered as a route.  
   - simple example  
```
.
  └── pages
    ├── index.route.tsx
    ├── users
    │  ├── _index.route.tsx
    │  └── [id].route.tsx
    ├── about
    │  ├── index.route.tsx
    │  └── [id].route.tsx
    ├── me.route.tsx
    ├── 404.route.tsx
    └── invalid.tsx
``` 
result:
```
[
  { path: '/', element: '<rootDir>/pages/index.route.tsx' },
  {
    path: 'users/*',
    element: '<rootDir>/pages/users/index.route.tsx',
    children: [
      { path: ':id', element: '<rootDir>/pages/users/[id].route.tsx' },
     ]
  },
  { path: 'about', element: '<rootDir>/pages/about/index.route.tsx' },
  { path: 'about/:id', element: '<rootDir>/pages/about/[id].route.tsx' },
  { path: 'me', element: '<rootDir>/pages/me.route.tsx' },
  { path: '*', element: '<rootDir>/pages/404.route.tsx' },
]
```
