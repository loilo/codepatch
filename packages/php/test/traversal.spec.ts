import { expect, it } from 'vitest'
import { modify } from '../src/main'

it('should correctly access parent nodes', () => {
  expect.assertions(5)

  const src = `(function () {$xs = [ 1, 2, 3 ];fun($ys);})()`

  const output = modify(src, (node, { source, parent, override }) => {
    if (node.kind === 'array') {
      expect(parent()?.kind).toBe('assign')
      expect(source(parent()!)).toBe('$xs = [ 1, 2, 3 ];')
      expect(parent(2)?.kind).toBe('expressionstatement')
      expect(source(parent(2)!)).toBe('$xs = [ 1, 2, 3 ];')
      override(parent()!, '$ys = 4;')
    }
  })

  Function(
    'fun',
    output.toString()
  )((x: any) => {
    expect(x).toBe(4)
  })
})

it('should correctly access and override arbitrary traversed nodes', () => {
  expect.assertions(3)

  const output = modify(
    '$x + $y',
    (node: any, { parent, source, override }) => {
      if (node.kind === 'variable' && node.name === 'x') {
        const parentNode: any = parent()
        expect(parentNode?.right.name).toBe('y')
        expect(source(parentNode?.right)).toBe('$y')
        override(parentNode?.right, '$z')
      }
    }
  )

  expect(output.toString()).toBe('$x + $z')
})
