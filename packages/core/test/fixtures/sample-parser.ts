export type SampleParserOptions = {
  delimiter?: string
}

type Token = {
  type: string
  value: string
  loc: [start: number, end: number]
}

type IntegerNode = {
  type: 'integer'
  value: number
  loc: [start: number, end: number]
}

type GroupNode = {
  type: 'group'
  children: Array<IntegerNode | GroupNode>
  loc: [start: number, end: number]
}

type ProgramNode = {
  type: 'program'
  children: GroupNode[]
  loc: [start: number, end: number]
}

export type SampleParserNode = ProgramNode | IntegerNode | GroupNode

export class SampleParser {
  #options: SampleParserOptions

  constructor({ delimiter = ',' }: SampleParserOptions = {}) {
    this.#options = {
      delimiter
    }
  }

  #tokenize(code: string) {
    const tokens: Token[] = []

    let i = 0
    const chars = [...code]
    while (i < chars.length) {
      const start = i
      let char = chars[i]

      const INTEGER = /[0-9]/
      if (INTEGER.test(char)) {
        let value = ''
        while (INTEGER.test(char)) {
          value += char
          char = chars[++i]
        }

        tokens.push({
          type: 'integer',
          value: value,
          loc: [start, i]
        })
        continue
      }

      if (char === '(' || char === ')') {
        tokens.push({
          type: 'paren',
          value: char,
          loc: [start, start + 1]
        })
        i++
        continue
      }

      if (char === this.#options.delimiter) {
        tokens.push({
          type: 'delimiter',
          value: char,
          loc: [start, start + 1]
        })
        i++
        continue
      }

      if (/\s/.test(char)) {
        i++
        continue
      }

      throw new TypeError(`Unexpected character "${char}" at ${i}`)
    }

    return tokens
  }

  #parse(tokens: Token[]) {
    let i = 0
    let expectingDelimiter = false
    let inGroup = false

    function walk(): SampleParserNode | undefined {
      let token = tokens[i]

      if (token.type === 'delimiter') {
        if (!inGroup) {
          throw new Error(`Unexpected delimiter at offset ${token.loc[0]}`)
        }

        if (!expectingDelimiter) {
          throw new Error(`Unexpected delimiter at offset ${token.loc[0]}`)
        }

        expectingDelimiter = false
        i++

        return
      }

      if (token.type === 'integer') {
        if (!inGroup) {
          throw new Error(
            `Unexpected integer at offset ${token.loc[0]} outside of group`
          )
        }

        if (expectingDelimiter) {
          throw new Error(`Unexpected integer at offset ${token.loc[0]}`)
        }

        expectingDelimiter = true

        i++

        return {
          type: 'integer',
          value: Number(token.value),
          loc: token.loc
        }
      }

      if (token.type === 'paren' && token.value === '(') {
        if (expectingDelimiter) {
          throw new Error(`Unexpected opening paren at offset ${token.loc[0]}`)
        }

        const start = token.loc[0]
        const end = token.loc[1]

        token = tokens[++i]

        const node: GroupNode = {
          type: 'group',
          children: [],
          loc: [start, end]
        }

        while (
          token.type !== 'paren' ||
          (token.type === 'paren' && token.value !== ')')
        ) {
          inGroup = true
          const child = walk()
          if (child) {
            node.children.push(child as IntegerNode | GroupNode)
          }
          token = tokens[i]

          if (i > tokens.length - 1) {
            throw new Error('Unexpected end of input, missing closing paren')
          }
        }

        if (!expectingDelimiter && node.children.length > 0) {
          throw new Error(`Unexpected closing paren at offset ${token.loc[0]}`)
        }

        inGroup = false
        expectingDelimiter = true
        node.loc[1] = token.loc[1]

        i++

        return node
      }

      throw new TypeError(`Unexpected token ${token.type}`)
    }

    const ast: ProgramNode = {
      type: 'program',
      children: [],
      loc: [tokens[0].loc[0], tokens[tokens.length - 1].loc[1]]
    }

    while (i < tokens.length) {
      const child = walk()
      if (child) {
        ast.children.push(child as GroupNode)
      }
    }

    return ast
  }

  run(code: string) {
    const tokens = this.#tokenize(code)
    const program = this.#parse(tokens)
    return program
  }
}
