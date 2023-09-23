import { it, expect } from 'vitest'
import { modify } from '../src/main'

it('should correctly handle Promises returned from the manipulator', async () => {
  const source = ':root { border: 1px solid red; color: blue; }'

  let pending = 0
  const result = await modify(source, (node, { override, source }) => {
    if (node.type === 'Declaration') {
      return new Promise<void>(resolve => {
        pending++
        setTimeout(() => {
          override(`--${source()}`)
          pending--
          resolve()
        }, 50 * pending * 2)
      })
    }

    return
  })

  expect(result.code).toBe(':root { --border: 1px solid red; --color: blue; }')
})

it('should throw when override() is called after manipulator finished (sync)', async () => {
  expect.hasAssertions()

  await new Promise<void>(resolve => {
    setTimeout(resolve, 20)

    modify(':root {}', (_, { override }) => {
      setTimeout(() => {
        expect(() => {
          override('body {}')
        }).toThrowError()
      }, 10)
    })
  })
})

it("should throw when override() is called after iterated node's manipulator finished (async)", async () => {
  expect.hasAssertions()

  await modify(':root {}', (node, { override }) => {
    if (node.type === 'Rule') {
      setTimeout(() => {
        expect(() => {
          override('body {}')
        }).toThrowError()
      }, 10)
    }

    return Promise.resolve()
  })

  await new Promise(resolve => setTimeout(resolve, 20))
})

it("should throw when override() is called after target node's manipulator finished", () => {
  expect.hasAssertions()

  modify(':root {}', (node, { override }) => {
    if (node.type === 'Rule') {
      expect(() => {
        override((node as any).block, '{ color: red; }')
      }).toThrowError()
    }
  })
})
