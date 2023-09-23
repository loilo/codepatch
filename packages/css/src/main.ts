import { type SyncParserResult, createModifier } from '@codepatch/core'
import {
  parse as cssTreeParse,
  type ParseOptions,
  type CssNode
} from 'css-tree'

export { CssNode as AstNode }
export type ParserOptions = ParseOptions

export const { modify, source, parent, override } = createModifier<
  CssNode,
  ParserOptions,
  SyncParserResult<CssNode>
>({
  parse(code: string, options: ParserOptions = {}): CssNode {
    const ast = cssTreeParse(code, {
      ...options,
      positions: true,
      onParseError(error) {
        throw error
      }
    })

    const plainAstObject = JSON.parse(JSON.stringify(ast))

    return plainAstObject
  },
  isNode: (value: any): value is CssNode =>
    typeof value === 'object' &&
    value !== null &&
    typeof value.type === 'string',
  collectChildNodes(node: any) {
    const childNodes: any[] = []

    // Walk all AST node properties, performing a recursive `walk`
    // on everything that looks like another AST node
    for (const key of Object.keys(node)) {
      // Explicitely widen the types here since not all
      // properties are represented in acorn's typings
      const property = node[key] as any

      if (Array.isArray(property)) {
        // Step into arrays and walk their items
        for (const propertyElement of property) {
          if (this.isNode(propertyElement)) {
            childNodes.push(propertyElement)
          }
        }
      } else if (this.isNode(property)) {
        childNodes.push(property)
      }
    }

    return childNodes
  },
  getNodeLocation: node => [node.loc!.start.offset, node.loc!.end.offset]
})
