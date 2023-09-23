import { expect, it } from 'vitest'

import { createModifier } from '../src/main'
import { sampleParserConfig } from './fixtures/sample-parser-config'

it('creates a modifier which is a function', () => {
  const { modify } = createModifier(sampleParserConfig)

  expect(typeof modify).toBe('function')
})
