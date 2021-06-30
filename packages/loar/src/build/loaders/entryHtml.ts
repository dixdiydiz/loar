import type { LoaderDefinitionFunction } from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import htmlparser2 from 'htmlparser2'
import { isString } from '../../utils'

const index = 0

export const entryHtmlLoader: LoaderDefinitionFunction = (
  content,
  map,
  meta
) => {
  const isModule = false
  const parser = new htmlparser2.Parser({
    onopentag(name, attrs) {
      if (name === 'script' && attrs.type === 'module') {
        if (isString(attrs.src)) {
          content = ''
        }
      }
    }
  })
  parser.write(content)
}
export default entryHtmlLoader
