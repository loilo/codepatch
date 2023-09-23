import { it, test, expect } from 'vitest'
import { modify } from '../src/main'
import { arrayBase } from './base-test'

it('should pass the base test', () => {
  const { src, validate } = arrayBase(3)

  const output = modify(src, (node, { override, source }) => {
    if (node.type === 'ArrayExpression') {
      override(`fn(${source()})`)
    }
  })

  expect(typeof output).toBe('object')
  expect(output).not.toBeNull()
  expect(output.code).toBe(output.toString())

  validate(output as any)
})

test('source() should return replaced content', () => {
  expect.assertions(3)

  const result = modify('x + y', (node: any, { source, override, parent }) => {
    if (node.type === 'Identifier') {
      if (node.name === 'x') {
        expect(source((parent(node) as any).right)).toBe('y')
        override((parent(node) as any).right, 'z')
      } else {
        expect(source(node)).toBe('z')
      }
    }
  })

  expect(result.toString()).toBe('x + z')
})

it('should allow for multiple overrides on the same node', () => {
  expect.assertions(1)

  const result = modify('x + y', (node: any, { override, parent }) => {
    if (node.type === 'Identifier') {
      if (node.name === 'x') {
        override((parent(node) as any).right, 'z')
      } else {
        override('z2')
      }
    }
  })

  expect(result.toString()).toBe('x + z2')
})
