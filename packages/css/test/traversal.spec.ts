import { expect, it } from 'vitest'
import { modify } from '../src/main'

it('should correctly access parent nodes', () => {
  expect.assertions(5)

  const source = ':root { border: 1px solid red; }'

  const result = modify(source, (node, { source, parent, override }) => {
    if (node.type === 'Dimension') {
      expect(parent()?.type).toBe('Value')
      expect(source(parent()!)).toBe('1px solid red')
      expect(parent(2)?.type).toBe('Declaration')
      expect(source(parent(2)!)).toBe('border: 1px solid red')
      override(parent()!, 'none')
    }
  })

  expect(result.code).toBe(':root { border: none; }')
})

it('should correctly access and override arbitrary traversed nodes', () => {
  expect.assertions(3)

  const output = modify(
    ':root { border: 1px solid red; }',
    (node: any, { parent, source, override }) => {
      if (node.type === 'Dimension') {
        const sibling = (parent() as any)?.children[1]
        expect(sibling.name).toBe('solid')
        expect(source(sibling)).toBe('solid')
        override(sibling, 'dotted')
      }
    }
  )

  expect(output.toString()).toBe(':root { border: 1px dotted red; }')
})
