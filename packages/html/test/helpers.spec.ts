import { expect, test } from 'vitest'
import {
  modify,
  source as externalSource,
  parent as externalParent,
  override as externalOverride
} from '../src/main'

test('should expose node helpers', () => {
  expect.assertions(7)

  const output = modify(
    '<div>hello world</div>',
    (node, { source, parent }) => {
      expect(externalSource(node)).toBe(source())
      expect(externalParent(node)).toBe(parent())

      if (node.type === 'text') {
        externalOverride(node, 'HELLO WORLD')
      }
    }
  )

  expect(output.code).toBe('<div>HELLO WORLD</div>')
})
