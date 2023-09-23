import { expect, it } from 'vitest'

import { createModifier } from '../src/main'
import { sampleParserConfig } from './fixtures/sample-parser-config'

it('reads the source of the current node with the passed source() helper', () => {
  const { modify } = createModifier(sampleParserConfig)

  expect.assertions(2)

  modify('(1,2,3)', (node, { source }) => {
    if (node.type === 'integer' && node.value === 2) {
      expect(source()).toBe('2')
    }

    if (node.type === 'group') {
      expect(source()).toBe('(1,2,3)')
    }
  })
})

it('reads the source of any given node with the passed source() helper', () => {
  const { modify } = createModifier(sampleParserConfig)

  expect.assertions(1)

  modify('(1,2,3)', (node, { source }) => {
    if (node.type === 'program') {
      expect(source(node.children![0].children[0])).toBe('1')
    }
  })
})

it('reads the source of a node with the global source() helper', () => {
  const { modify, source } = createModifier(sampleParserConfig)

  expect.assertions(1)

  modify('(1,2,3)', node => {
    if (node.type === 'integer' && node.value === 2) {
      expect(source(node)).toBe('2')
    }
  })
})
