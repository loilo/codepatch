import { expect, it } from 'vitest'

import { createModifier } from '../src/main'
import {
  sampleParserConfig,
  asyncSampleParserConfig
} from './fixtures/sample-parser-config'

it('overrides the content of the current node with the passed override() helper', () => {
  const { modify } = createModifier(sampleParserConfig)

  const result = modify('(1, 5, 3)', (node, { override }) => {
    if (node.type === 'integer' && node.value === 5) {
      override('2')
    }
  })

  expect(result.code).toBe('(1, 2, 3)')
})

it('overrides the content of any given node with the passed override() helper', () => {
  const { modify } = createModifier(sampleParserConfig)

  const result = modify('(1, (2, 3), 4)', (node, { override, parent }) => {
    if (node.type === 'integer' && node.value === 2) {
      override(parent()!, '5')
    }
  })

  expect(result.code).toBe('(1, 5, 4)')
})

it('overrides the content of a node with the global override() helper', () => {
  const { modify, override } = createModifier(sampleParserConfig)

  const result = modify('(1, 2, 3)', (node, { source }) => {
    if (node.type === 'integer') {
      override(node, `${source()}, ${source()}`)
    }
  })

  expect(result.code).toBe('(1, 1, 2, 2, 3, 3)')
})

it('does override in an async manipulator function', async () => {
  const { modify } = createModifier(asyncSampleParserConfig)

  expect.hasAssertions()

  const result = await modify('(1,2,3)', async (node, { override }) => {
    await new Promise(resolve => setTimeout(resolve, 0))

    if (node.type === 'integer' && node.value === 2) {
      override('22')
    }
  })

  expect(result.code).toBe('(1,22,3)')
})

it('throws when overriding a node after finishing it', async () => {
  const { modify, override: externalOverride } = createModifier(
    asyncSampleParserConfig
  )

  expect.assertions(3)

  const result = await modify('(1,2,3)', async (node, { override }) => {
    if (node.type === 'group') {
      setTimeout(() => {
        expect(() => {
          override('()')
        }).toThrowError()

        expect(() => {
          externalOverride(node, '()')
        }).toThrowError()
      }, 0)
    }
  })

  // Code should not have changed
  expect(result.code).toBe('(1,2,3)')

  // Wait for the throwing timeouts to finish
  await new Promise(resolve => setTimeout(resolve, 0))
})
