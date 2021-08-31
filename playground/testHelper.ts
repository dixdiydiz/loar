export function cutoutBasePath(src: string) {
  const basePath = src.split('__tests__')?.[0]
  if (basePath.includes(__dirname)) {
    return basePath
  }
  return undefined
}
