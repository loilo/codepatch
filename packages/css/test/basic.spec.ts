import { it, test, expect } from 'vitest'
import { modify } from '../src/main'

it('should pass the base test', () => {
  const source = `:root { border: 1px solid red; color: blue; }`

  const result = modify(source, (node, { override, source }) => {
    if (node.type === 'Declaration') {
      override(`--${source()}`)
    }
  })

  expect(typeof result).toBe('object')
  expect(result).not.toBeNull()
  expect(result.code).toBe(result.toString())

  expect(result.code).toBe(':root { --border: 1px solid red; --color: blue; }')
})

test('source() should return replaced content', () => {
  expect.assertions(3)

  const result = modify(
    ':root { border: 1px red; }',
    (node: any, { source, override, parent }) => {
      if (node.type === 'Dimension') {
        const parentNode: any = parent(node)
        expect(source(parentNode.children[1])).toBe('red')
        override(parentNode.children[1], 'blue')
      } else if (node.type === 'Identifier') {
        expect(source(node)).toBe('blue')
      }
    }
  )

  expect(result.toString()).toBe(':root { border: 1px blue; }')
})

it('should allow for multiple overrides on the same node', () => {
  expect.assertions(1)

  const result = modify(
    ':root { border: 1px red; }',
    (node: any, { override, parent }) => {
      if (node.type === 'Dimension') {
        override((parent() as any).children[1], 'blue')
      } else if (node.type === 'Identifier') {
        override('green')
      }
    }
  )

  expect(result.toString()).toBe(':root { border: 1px green; }')
})
