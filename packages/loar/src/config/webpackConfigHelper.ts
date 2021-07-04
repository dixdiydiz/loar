import type { RuleSetRule } from 'webpack'
import { isArray } from '../utils'

export function combineRules(
  rules: RuleSetRule[],
  insertRules: unknown
): RuleSetRule[] {
  if (isArray(insertRules)) {
    for (const rule of insertRules) {
      const { use, test } = rule
      const found = rules.find(({ test: t }) => String(t) === String(test))
      if (found) {
        const foundUse = isArray(found.use)
          ? found.use
          : [{ loader: found.loader, options: found.options }]
        const rewriteUse = [
          ...(isArray(use)
            ? use
            : [{ loader: found.loader, options: found.options }]),
          ...foundUse
        ]
        Object.assign(found, rule, { use: rewriteUse })
      } else {
        rules.push(rule)
      }
    }
  }
  return rules
}
