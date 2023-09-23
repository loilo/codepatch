import { expect, it } from 'vitest'
import { modify } from '../src/main'

it('should respect css-tree options', () => {
  const source = 'color: red'

  expect.assertions(2)

  function replacer() {}

  expect(() => modify(source, { parser: {} }, replacer)).toThrow()

  expect(() =>
    modify(source, { parser: { context: 'declaration' } }, replacer)
  ).not.toThrow()
})

it('should create a high-resolution source map', () => {
  const result = modify(
    ':root {}',
    { sourceMap: { hires: true } },
    (node, { override }) => {
      if (node.type === 'PseudoClassSelector') {
        override('body')
      }
    }
  )

  expect(result.code).toBe('body {}')

  expect(result.map).toEqual({
    file: undefined,
    mappings: 'AAAA,IAAK,CAAC,CAAC',
    names: [],
    sources: [''],
    sourcesContent: undefined,
    version: 3
  })
})
