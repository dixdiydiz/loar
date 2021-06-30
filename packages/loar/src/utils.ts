export const isString = (arg: unknown): arg is string => typeof arg === 'string'

export const isArray = (arg: unknown): arg is any[] => Array.isArray(arg)

const toString = (arg: unknown): string => (
  (arg = Object.prototype.toString.call(arg)),
  (<string>arg).substring(8, (<string>arg).length - 1)
)

export const isObject = (arg: unknown): boolean => toString(arg) === 'Object'
// eslint-disable-next-line @typescript-eslint/ban-types
export const isFunction = (arg: unknown): arg is Function =>
  arg instanceof Function
export const isAsyncFunction = (arg: unknown): boolean =>
  toString(arg) == 'AsyncFunction'
export const isGeneratorFunction = (arg: unknown): boolean =>
  toString(arg) == 'GeneratorFunction'
