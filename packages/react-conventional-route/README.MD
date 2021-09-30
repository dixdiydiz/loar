## React Conventional Route
***
### argements
- root`required`  
Desc: root directory of the matching route.  
Type: string | string[]
- routeMatch`optional`   
Desc: which files are considered routes.  
Type: Glob  
Example: `["**/*.route.{js,jsx,ts,tsx}"]`
- exclude`optional`  
Desc: which files are not be considered routes.  
Type: Glob  
Example: `["**/__tests__/**"]`  

### Features which does not support modified
- `index` prefix file name in the directory.  
file name which is prefixed with index would transform to parent `<Route />`.  
like: `index.route.tsx` --> 
```
<Route path="/" element={<Index />}>
  // files at the same level in the directory
  <Route path="messages"  element={<div />} />
  <Route path="tasks" element={<div />} />
</Route>
```
- `404` prefix file name in the directory.
- Handling not found url.  
  like: `404.route.tsx` -->
```
<Route path="/" element={<Dashboard />}>
  // files at the same level in the directory
  <Route path="messages" element={<div />} />
  <Route path="tasks" element={<div />} />
  <Route path="*" element={<404 />} }
</Route>
```

***
### Example  
*Assuming the rules above.*
1. Only file name contains `route` will be registered as a route.  
   - simple example  
```
.
  └── routes
    ├── index.route.tsx
    ├── users
      └──index.route.tsx
      └──[id].route.tsx
    └── me.route.tsx
    └── invalid.tsx
``` 
result:
```
[
  { path: '/', element: '<rootDir>/routes/index.route.tsx' },
  {
    path: 'users',
    element: '<rootDir>/routes/index.route.tsx',
    children: [
      { path: '/', element: <UsersIndex /> },
      { path: ':id', element: <UserProfile /> },
      { path: 'me', element: <OwnUserProfile /> },
     ]
  }
]
```
