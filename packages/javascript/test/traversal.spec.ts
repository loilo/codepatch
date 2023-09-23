import { expect, it } from 'vitest'
import { modify } from '../src/main'

it('should correctly access parent nodes', () => {
  expect.assertions(5)

  const src = `(function () {var xs = [ 1, 2, 3 ];fn(ys);})()`

  const output = modify(src, (node: any, { source, parent, override }) => {
    if (node.type === 'ArrayExpression') {
      const parentNode: any = parent()
      const grandParentNode: any = parent(2)

      expect(parentNode.type).toBe('VariableDeclarator')
      expect(source(parentNode)).toBe('xs = [ 1, 2, 3 ]')
      expect(grandParentNode.type).toBe('VariableDeclaration')
      expect(source(grandParentNode)).toBe('var xs = [ 1, 2, 3 ];')
      override(parentNode, 'ys = 4;')
    }
  })

  Function(
    'fn',
    output.code
  )((x: any) => {
    expect(x).toBe(4)
  })
})

it('should correctly access and override arbitrary traversed nodes', () => {
  expect.assertions(3)

  const output = modify('x + y', (node: any, { parent, source, override }) => {
    if (node.type === 'Identifier' && node.name === 'x') {
      const parentNode: any = parent()

      expect(parentNode.right.name).toBe('y')
      expect(source(parentNode.right)).toBe('y')
      override(parentNode.right, 'z')
    }
  })

  expect(output.toString()).toBe('x + z')
})
