import { expect, it } from 'vitest'
import { modify } from '../src/main'

it('should respect htmlparser2 options', () => {
  const source = '&auml;'

  expect.assertions(2)

  modify(source, { parser: {} }, node => {
    if (node.type === 'text') {
      expect(node.data).toBe('ä')
    }
  })

  modify(
    source,
    {
      parser: {
        htmlparser2: {
          decodeEntities: false
        }
      }
    },
    node => {
      if (node.type === 'text') {
        expect(node.data).toBe('&auml;')
      }
    }
  )
})

it('should create a high-resolution source map', () => {
  const result = modify(
    'hello<br>world',
    { sourceMap: { hires: true } },
    (node, { source, override }) => {
      if (node.type === 'text') {
        override(source().toUpperCase())
      }
    }
  )

  expect(result.code).toBe('HELLO<br>WORLD')

  expect(result.map).toEqual({
    file: undefined,
    mappings: 'AAAA,KAAK,CAAC,CAAC,CAAC,CAAC',
    names: [],
    sources: [''],
    sourcesContent: undefined,
    version: 3
  })
})
