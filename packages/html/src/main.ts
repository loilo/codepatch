import { type SyncParserResult, createModifier } from '@codepatch/core'
import {
  Parser,
  type ParserOptions as Htmlparser2Options,
  ElementType
} from 'htmlparser2'
import {
  DomHandler,
  type AnyNode,
  type DomHandlerOptions,
  type Document,
  type ParentNode
} from 'domhandler'

export type AstNode = AnyNode

export type ParserOptions = {
  htmlparser2?: Htmlparser2Options
  domhandler?: DomHandlerOptions
}

function isParentNode(node: any): node is ParentNode {
  return Array.isArray(node.childNodes)
}

export const { modify, source, parent, override } = createModifier<
  AstNode,
  ParserOptions,
  SyncParserResult<AstNode>
>({
  parse(code: string, options: ParserOptions = {}): AstNode {
    let result: AstNode
    const handler = new DomHandler(
      (error, dom) => {
        if (error) {
          throw error
        } else {
          const makeRoot = (recursive = false): Document => ({
            type: ElementType.Root,
            nodeType: 9,
            startIndex: 0,
            endIndex: code.length - 1,
            childNodes: recursive ? dom : [],
            children: recursive ? dom : [],
            firstChild: recursive ? dom[0] ?? null : null,
            lastChild: recursive ? dom[0] ?? null : null,
            parent: null,
            parentNode: null,
            prev: null,
            next: null,
            previousSibling: null,
            nextSibling: null,
            cloneNode: (recursive?: boolean) => makeRoot(recursive) as any
          })

          result = makeRoot(true)
        }
      },
      {
        ...options?.domhandler,
        withStartIndices: true,
        withEndIndices: true
      }
    )

    const parser = new Parser(handler, {
      ...options?.htmlparser2
    })
    parser.write(code)
    parser.end()

    return result!
  },
  isNode: (value: any): value is AstNode =>
    typeof value === 'object' &&
    value !== null &&
    typeof value.type === 'string',
  collectChildNodes(node: AstNode) {
    if (!isParentNode(node)) return []
    return node.childNodes
  },
  getNodeLocation: node => [node.startIndex!, node.endIndex! + 1]
})
