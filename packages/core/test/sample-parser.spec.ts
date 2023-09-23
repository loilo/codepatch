import { expect, it } from 'vitest'
import { SampleParser } from './fixtures/sample-parser'

// A bunch of snapshot tests checking the basic functionality of the sample parser

it('returns expected ASTs', () => {
  const parser = new SampleParser()

  expect(parser.run('(1,2,3)')).toMatchSnapshot()
  expect(parser.run('(1, 2, 3)')).toMatchSnapshot()
  expect(parser.run('(01, 20, 030)')).toMatchSnapshot()
  expect(parser.run('((1), 2, (3, (5, 6)), 7)')).toMatchSnapshot()
  expect(parser.run('(1, 2, ())')).toMatchSnapshot()
})

it('respects the "delimiter" option', () => {
  const parser = new SampleParser({ delimiter: '|' })

  expect(() => parser.run('(1,2,3)')).toThrow()
  expect(parser.run('(1|2|3)')).toMatchSnapshot()
  expect(parser.run('(1|(2|3)|4)')).toMatchSnapshot()
})

it('throws on invalid code', () => {
  const parser = new SampleParser()

  expect(() => parser.run('1,2,3')).toThrow()
  expect(() => parser.run('(1,2,3')).toThrow()
  expect(() => parser.run('(1/2)')).toThrow()
  expect(() => parser.run('(1 2)')).toThrow()
  expect(() => parser.run('(1), (2)')).toThrow()
})
