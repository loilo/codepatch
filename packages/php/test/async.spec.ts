import { it, expect } from 'vitest'
import { modify } from '../src/main'

it('should correctly handle Promises returned from the manipulator', async () => {
  const { src, validate } = (await import('./base-test')).arrayBase()

  let pending = 0
  const output = await modify(src, (node, { override, source }) => {
    if (node.kind === 'array') {
      return new Promise<void>(resolve => {
        pending++
        setTimeout(() => {
          override(`fun(${source()})`)
          pending--
          resolve()
        }, 50 * pending * 2)
      })
    }

    return
  })

  validate(output.toString())
})

it('should throw when override() is called after manipulator finished (sync)', async () => {
  expect.hasAssertions()

  await new Promise<void>(resolve => {
    setTimeout(resolve, 20)

    modify('(false)', (_, { override }) => {
      setTimeout(() => {
        expect(() => {
          override('true')
        }).toThrowError()
      }, 10)
    })
  })
})

it("should throw when override() is called after iterated node's manipulator finished (async)", async () => {
  expect.hasAssertions()

  await modify('(false)', (node, { override }) => {
    if (node.kind === 'boolean') {
      setTimeout(() => {
        expect(() => {
          override('true')
        }).toThrowError()
      }, 10)
    }

    return Promise.resolve()
  })

  await new Promise(resolve => setTimeout(resolve, 20))
})

it("should throw when override() is called after target node's manipulator finished", () => {
  expect.hasAssertions()

  modify('(false)', (node, { override }) => {
    if (node.kind === 'expressionstatement') {
      expect(() => {
        override((node as any).expression, '(true)')
      }).toThrowError()
    }
  })
})
