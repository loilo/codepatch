import { expect, test } from 'vitest'
import {
  modify,
  source as externalSource,
  parent as externalParent,
  override as externalOverride
} from '../src/main'

test('should expose node helpers', () => {
  expect.assertions(23)

  const output = modify(
    ':root { border: 1px solid red; }',
    (node, { source, parent }) => {
      expect(externalSource(node)).toBe(source())
      expect(externalParent(node)).toBe(parent())

      if (node.type === 'Identifier' && node.name === 'red') {
        externalOverride(node, 'blue')
      }
    }
  )

  expect(output.code).toBe(':root { border: 1px solid blue; }')
})
