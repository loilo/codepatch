import { it, test, expect } from 'vitest'
import { modify } from '../src/main'

it('should pass the base test', () => {
  const result = modify('hello<br>world', (node, { override, source }) => {
    if (node.type === 'text') {
      override(source().toUpperCase())
    }
  })

  expect(typeof result).toBe('object')
  expect(result).not.toBeNull()
  expect(result.code).toBe(result.toString())

  expect(result.code).toBe('HELLO<br>WORLD')
})

test('source() should return replaced content', () => {
  expect.assertions(3)

  const result = modify(
    '<hr><br>',
    (node: any, { source, override, parent }) => {
      if (node.type === 'tag' && node.name === 'hr') {
        const parentNode: any = parent(node)
        expect(source(parentNode.children[1])).toBe('<br>')
        override(parentNode.children[1], '<wbr>')
      } else if (node.type === 'tag' && node.name === 'br') {
        expect(source(node)).toBe('<wbr>')
      }
    }
  )

  expect(result.toString()).toBe('<hr><wbr>')
})

it('should allow for multiple overrides on the same node', () => {
  expect.assertions(1)

  const result = modify('<hr><br>', (node: any, { override, parent }) => {
    if (node.type === 'tag' && node.name === 'hr') {
      override((parent() as any).children[1], '<wbr>')
    } else if (node.type === 'tag' && node.name === 'br') {
      override('<abbr>')
    }
  })

  expect(result.toString()).toBe('<hr><abbr>')
})
