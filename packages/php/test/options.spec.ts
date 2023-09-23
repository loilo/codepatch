import { expect, it } from 'vitest'
import { modify, type AstNode } from '../src/main'

it('should use the correct parse mode', () => {
  const source = '<?= "Hello world" ?>'

  expect(() =>
    modify(source, { parser: { parseMode: 'code' } }, () => {})
  ).not.toThrow()

  expect(() => modify(source, () => {})).toThrow()
})

it('should respect php-parser options', () => {
  const source = '$x + $y'

  function replacer(node: AstNode) {
    if (node.loc?.source == null) {
      throw new Error('Missing source')
    }
  }

  expect(() =>
    modify(source, { parser: { ast: { withSource: true } } }, replacer)
  ).not.toThrow()

  expect(() =>
    modify(source, { parser: { ast: { withSource: false } } }, replacer)
  ).toThrow()
})

it('should create a high-resolution source map', () => {
  const result = modify(
    '$x + $y',
    { sourceMap: { hires: true } },
    (node: any, { override }) => {
      if (node.kind === 'variable' && node.name === 'y') {
        override('$z')
      }
    }
  )

  expect(result.map).toEqual({
    file: undefined,
    mappings: 'AAAA,CAAC,CAAC,CAAC,CAAC,CAAC',
    names: [],
    sources: [''],
    sourcesContent: undefined,
    version: 3
  })
})
