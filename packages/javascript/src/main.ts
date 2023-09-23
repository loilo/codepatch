import { type SyncParserResult, createModifier } from '@codepatch/core'
import {
  Node as AcornNode,
  Options as AcornOptions,
  parse as acornDefaultParse,
  Parser as AcornParser
} from 'acorn'

export type { AcornNode as AstNode }

export type ParserOptions = Partial<AcornOptions> & {
  customParser?: typeof AcornParser
}

export const { modify, source, parent, override } = createModifier<
  AcornNode,
  ParserOptions,
  SyncParserResult<AcornNode>
>({
  parse(code: string, options: ParserOptions = {}): AcornNode {
    const { customParser, ...userProvidedAcornOptions } = options

    const acornOptions = {
      ecmaVersion: 'latest' as any,
      ...userProvidedAcornOptions
    }

    return customParser
      ? customParser.parse(code, acornOptions)
      : acornDefaultParse(code, acornOptions)
  },
  isNode: (value: any): value is AcornNode =>
    typeof value === 'object' &&
    value !== null &&
    typeof value.type === 'string',
  collectChildNodes(node) {
    const childNodes: AcornNode[] = []

    // Walk all AST node properties, performing a recursive `walk`
    // on everything that looks like another AST node
    for (const key of Object.keys(node)) {
      // Explicitely widen the types here since not all
      // properties are represented in acorn's typings
      const property = node[key as keyof AcornNode] as any

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
  getNodeLocation: node => [node.start, node.end]
})
