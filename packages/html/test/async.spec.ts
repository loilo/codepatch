import { it, expect } from 'vitest'
import { modify } from '../src/main'

it('should correctly handle Promises returned from the manipulator', async () => {
  let pending = 0
  const output = await modify(
    'hello<br>world',
    (node, { override, source }) => {
      if (node.type === 'text') {
        return new Promise<void>(resolve => {
          pending++
          setTimeout(() => {
            override(source().toUpperCase())
            pending--
            resolve()
          }, 50 * pending * 2)
        })
      }

      return
    }
  )

  expect(output.code).toBe('HELLO<br>WORLD')
})

it('should throw when override() is called after manipulator finished (sync)', async () => {
  expect.hasAssertions()

  await new Promise<void>(resolve => {
    setTimeout(resolve, 20)

    modify('hello', (_, { override }) => {
      setTimeout(() => {
        expect(() => {
          override('world')
        }).toThrowError()
      }, 10)
    })
  })
})

it("should throw when override() is called after iterated node's manipulator finished (async)", async () => {
  expect.hasAssertions()

  await modify('hello', (node, { override }) => {
    if (node.type === 'text') {
      setTimeout(() => {
        expect(() => {
          override('world')
        }).toThrowError()
      }, 10)
    }

    return Promise.resolve()
  })

  await new Promise(resolve => setTimeout(resolve, 20))
})

it("should throw when override() is called after target node's manipulator finished", () => {
  expect.hasAssertions()

  modify('<div>hello world</div>', (node, { override }) => {
    if (node.type === 'tag') {
      expect(() => {
        override((node as any).children[0], 'HELLO WORLD')
      }).toThrowError()
    }
  })
})
