import type { ParserConfiguration } from '../../src/main'
import {
  SampleParser,
  SampleParserOptions,
  SampleParserNode
} from './sample-parser'

export const sampleParserConfig = {
  parse: (code, options: SampleParserOptions = {}) => {
    const parser = new SampleParser(options)
    return parser.run(code)
  },
  isNode: (value: any): value is SampleParserNode =>
    typeof value?.type === 'string',
  collectChildNodes: node => (node as any).children ?? [],
  getNodeLocation: node => node.loc
} satisfies ParserConfiguration<SampleParserNode>

export const asyncSampleParserConfig = {
  ...sampleParserConfig,
  parse: async (code, options) => await sampleParserConfig.parse(code, options)
}
