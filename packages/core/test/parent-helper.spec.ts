import { expect, it } from 'vitest'

import { createModifier } from '../src/main'
import { sampleParserConfig } from './fixtures/sample-parser-config'

it('gets the parent of the current node with the passed parent() helper', () => {
  const { modify } = createModifier(sampleParserConfig)

  expect.assertions(2)

  modify('(1)', (node, { parent }) => {
    if (node.type === 'integer' && node.value === 1) {
      const parentNode = parent()
      expect(parentNode?.type).toBe('group')
      expect((parentNode as any)?.children?.[0]).toBe(node)
    }
  })
})

it('gets the nth ancestor of the current node with the passed parent() helper', () => {
  const { modify } = createModifier(sampleParserConfig)

  expect.assertions(3)

  modify('(1)', (node, { parent }) => {
    if (node.type === 'integer' && node.value === 1) {
      // parent(1) = same as parent()
      expect(parent(1)).toBe(parent())

      // parent(2) = parent of parent()
      const rootNode = parent(2)
      expect(rootNode?.type).toBe('program')

      // parent(3) = undefined as parent(2) is already the root node
      expect(parent(3)).toBeUndefined()
    }
  })
})

it('gets parent/nth ancestor of any given node with the passed parent() helper', () => {
  const { modify } = createModifier(sampleParserConfig)

  expect.assertions(2)

  modify('(1, (2))', (node, { parent }) => {
    if (node.type === 'integer' && node.value === 1) {
      const parentNode = parent()
      if (parentNode?.type !== 'group') return

      const nextNode = parentNode.children[1]
      const twoNode = (nextNode as any).children[0]

      expect(parent(twoNode)).toBe(nextNode)
      expect(parent(twoNode, 2)).toBe(parentNode)
    }
  })
})

it('gets the parent/nth ancestor of any given node with the global parent() helper', () => {
  const { modify, parent } = createModifier(sampleParserConfig)

  expect.assertions(2)

  modify('(1, (2))', node => {
    if (node.type === 'integer' && node.value === 1) {
      const parentNode = parent(node)
      if (parentNode?.type !== 'group') return

      const nextNode = parentNode.children[1]
      const twoNode = (nextNode as any).children[0]

      expect(parent(twoNode)).toBe(nextNode)
      expect(parent(twoNode, 2)).toBe(parentNode)
    }
  })
})
