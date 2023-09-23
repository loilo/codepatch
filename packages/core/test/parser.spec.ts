import { expect, it } from 'vitest'

import { createModifier } from '../src/main'
import {
  sampleParserConfig,
  asyncSampleParserConfig
} from './fixtures/sample-parser-config'

it('throws when the parser throws', () => {
  const { modify } = createModifier(sampleParserConfig)
  expect(() => {
    modify('1', () => {})
  }).toThrow()
})

it('throws when the parser throws (async)', () => {
  const { modify } = createModifier(asyncSampleParserConfig)
  expect(async () => {
    await modify('1', () => {})
  }).rejects.toThrow()
})

it('respects the "delimiter" parser option', () => {
  expect.assertions(4)

  const code = '(1|2|3)'

  const { modify } = createModifier(sampleParserConfig)
  const result = modify(code, { parser: { delimiter: '|' } }, node => {
    if (node.type === 'integer') {
      expect(typeof node.value).toBe('number')
    }
  })

  expect(String(result)).toBe(code)
})
