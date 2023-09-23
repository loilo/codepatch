import { expect, it } from 'vitest'
import { modify } from '../src/main'

it('should correctly access parent nodes', () => {
  expect.assertions(5)

  const source = '<div>hello world</div>\n'

  const result = modify(source, (node, { source, parent, override }) => {
    if (node.type === 'text' && node.data === 'hello world') {
      expect((parent() as any).name).toBe('div')
      expect(source(parent()!)).toBe('<div>hello world</div>')
      expect(parent(2)?.type).toBe('root')
      expect(source(parent(2)!)).toBe('<div>hello world</div>\n')
      override(parent()!, 'empty')
    }
  })

  expect(result.code).toBe('empty\n')
})

it('should correctly access and override arbitrary traversed nodes', () => {
  expect.assertions(3)

  const output = modify(
    'hello<br>w&ouml;rld',
    (node: any, { parent, source, override }) => {
      if (node.type === 'text' && node.data === 'hello') {
        const sibling = (parent() as any)?.children[2]
        expect(sibling.data).toBe('wörld')
        expect(source(sibling)).toBe('w&ouml;rld')
        override(sibling, 'wörld')
      }
    }
  )

  expect(output.toString()).toBe('hello<br>wörld')
})
