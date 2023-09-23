import { expect, it } from 'vitest'
import { modify } from '../src/main'
import { arrayBase } from './base-test'

it('should correctly handle Promises returned from the manipulator', async () => {
  const { src, validate } = arrayBase()

  let pending = 0
  const output = await modify(src, (node: any, { override, source }) => {
    if (node.type === 'ArrayExpression') {
      return new Promise<void>(resolve => {
        pending++
        setTimeout(() => {
          override(`fn(${source()})`)
          pending--
          resolve()
        }, 50 * pending * 2)
      })
    }

    return
  })

  validate(output as any)
})

it('should throw when override() is called after manipulator finished (sync)', async () => {
  expect.hasAssertions()

  await new Promise(resolve => {
    setTimeout(resolve, 20)

    modify('false', (_, { override }) => {
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

  await modify('false', (_, { override }) => {
    setTimeout(() => {
      expect(() => {
        override('true')
      }).toThrowError()
    }, 10)

    return Promise.resolve()
  })

  await new Promise(resolve => setTimeout(resolve, 20))
})

it("should throw when override() is called after target node's manipulator finished", () => {
  expect.hasAssertions()

  modify('false', (node: any, { override }) => {
    if (node.type === 'ExpressionStatement') {
      expect(() => {
        override(node.expression, 'true')
      }).toThrowError()
    }
  })
})
