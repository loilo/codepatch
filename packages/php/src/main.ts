import { type SyncParserResult, createModifier } from '@codepatch/core'
import { default as phpParser, type Node as PhpParserNode } from 'php-parser'

const Engine = phpParser.Engine

export type { PhpParserNode as AstNode }

export type ParserOptions = Record<string, any> & {
  parseMode?: 'code' | 'eval'
}

export const { modify, source, parent, override } = createModifier<
  PhpParserNode,
  ParserOptions,
  SyncParserResult<PhpParserNode>
>({
  parse(code: string, options: ParserOptions = {}): PhpParserNode {
    const { parseMode = 'eval', ...phpOptions } = options

    const engine = new Engine({
      ...phpOptions,
      ast: {
        ...(phpOptions.ast ?? {}),
        withPositions: true
      }
    })

    return parseMode === 'eval'
      ? engine.parseEval(code)
      : engine.parseCode(code, 'codepatch.php')
  },
  isNode: (value: any): value is PhpParserNode =>
    typeof value === 'object' &&
    value !== null &&
    typeof value.kind === 'string',
  collectChildNodes(node) {
    const childNodes: PhpParserNode[] = []

    // Walk all AST node properties, performing a recursive `walk`
    // on everything that looks like another AST node
    for (const key of Object.keys(node)) {
      const property = node[key as keyof PhpParserNode]

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
