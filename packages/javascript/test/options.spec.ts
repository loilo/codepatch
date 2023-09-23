import { expect, it } from 'vitest'
import { modify } from '../src/main'

import jsx from 'acorn-jsx'
import { Parser } from 'acorn'

it('should apply a custom parser', () => {
  const jsxParser = Parser.extend(jsx())

  const code =
    '(function() { var f = {a: "b"}; var a = <div {...f} className="test"></div>; })()'

  const nodeTypes = [
    'Identifier',
    'Identifier',
    'Literal',
    'Property',
    'ObjectExpression',
    'VariableDeclarator',
    'VariableDeclaration',
    'Identifier',
    'Identifier',
    'JSXSpreadAttribute',
    'JSXIdentifier',
    'Literal',
    'JSXAttribute',
    'JSXIdentifier',
    'JSXOpeningElement',
    'JSXIdentifier',
    'JSXClosingElement',
    'JSXElement',
    'VariableDeclarator',
    'VariableDeclaration',
    'BlockStatement',
    'FunctionExpression',
    'CallExpression',
    'ExpressionStatement',
    'Program'
  ]

  expect.assertions(nodeTypes.length)

  modify(code, { parser: { customParser: jsxParser } }, node => {
    expect(node.type).toBe(nodeTypes.shift())
  })
})

it('should respect acorn options', () => {
  const source = '#!/usr/bin/env node'

  expect(() =>
    modify(source, { parser: { allowHashBang: true } }, () => undefined)
  ).not.toThrow()

  expect(() =>
    modify(source, { parser: { allowHashBang: false } }, () => undefined)
  ).toThrow()
})

it('should create a high-resolution source map', () => {
  const result = modify(
    'x + y',
    { sourceMap: { hires: true } },
    (node: any, { override }) => {
      if (node.type === 'Identifier' && node.name === 'y') {
        override('z')
      }
    }
  )

  expect(result.map).toEqual({
    file: undefined,
    mappings: 'AAAA,CAAC,CAAC,CAAC,CAAC',
    names: [],
    sources: [''],
    sourcesContent: undefined,
    version: 3
  })
})
