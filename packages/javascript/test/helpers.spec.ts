import { expect, it } from 'vitest'
import {
  modify,
  source as externalSource,
  parent as externalParent,
  override as externalOverride
} from '../src/main'

it('should expose node helpers', () => {
  expect.assertions(11)

  const output = modify('x + y', (node, { source, parent }) => {
    expect(externalSource(node)).toBe(source())
    expect(externalParent(node)).toBe(parent())

    if (node.type === 'Identifier') {
      externalOverride(node, 'z')
    }
  })

  expect(output.code).toBe('z + z')
})
