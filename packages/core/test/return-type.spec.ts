import { SourceMap } from 'magic-string'
import { expect, test } from 'vitest'

import { createModifier } from '../src/main'
import {
  asyncSampleParserConfig,
  sampleParserConfig
} from './fixtures/sample-parser-config'

test('modifier returns a properly shaped object', () => {
  const { modify } = createModifier(sampleParserConfig)

  const modificationResult = modify('()', () => {})

  expect(modificationResult).toMatchObject({
    map: expect.any(SourceMap),
    code: expect.any(String)
  })

  expect(String(modificationResult)).toBe(modificationResult.code)
})

test('async callback leads to modifiers returning a promise', async () => {
  const { modify } = createModifier(sampleParserConfig)

  const modificationResult = modify('()', () => Promise.resolve())

  expect(modificationResult).toBeInstanceOf(Promise)

  const resolvedModificationResult = await modificationResult

  expect(resolvedModificationResult).toMatchObject({
    map: expect.any(SourceMap),
    code: expect.any(String)
  })
})

test('async parser leads to modifiers returning a promise', async () => {
  const { modify } = createModifier(asyncSampleParserConfig)

  const modificationResult = modify('()', () => {})

  expect(modificationResult).toBeInstanceOf(Promise)

  const resolvedModificationResult = await modificationResult

  expect(resolvedModificationResult).toMatchObject({
    map: expect.any(SourceMap),
    code: expect.any(String)
  })
})
