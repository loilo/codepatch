import MagicString, { SourceMap, SourceMapOptions } from 'magic-string'

/**
 * Union any type with `undefined`
 */
type Maybe<T> = T | undefined

/**
 * Result of a synchronous parser
 */
export type SyncParserResult<AstNode> = AstNode

/**
 * Result of an asynchronous parser
 */
export type AsyncParserResult<AstNode> = Promise<SyncParserResult<AstNode>>

/**
 * Result of a parser
 */
export type ParserResult<AstNode> =
  | SyncParserResult<AstNode>
  | AsyncParserResult<AstNode>

/**
 * Tools for handling a certain language/parser
 */
export type ParserConfiguration<
  AstNode,
  ParserOptions = undefined,
  ConcreteParserResult extends ParserResult<AstNode> = ParserResult<AstNode>
> = {
  /**
   * Parse code to an AST, synchronously or asynchronously
   *
   * @param code    The code to parse
   * @param options Options passed to the parser
   */
  parse(code: string, options?: ParserOptions): ConcreteParserResult

  /**
   * Check whether a value is an AST node
   *
   * @param value The value to check
   */
  isNode(value: any): value is AstNode

  /**
   * Get child nodes of a given AST node
   *
   * @param node The AST node to collect child nodes from
   */
  collectChildNodes(node: AstNode): AstNode[]

  /**
   * Get the location (start and end as character offset) of a given AST node
   *
   * @param node The AST node to get the location for
   */
  getNodeLocation(node: AstNode): [start: number, end: number]
}

/**
 * Options passed to a modifier run
 */
type ModifierOptions<ParserOptions> = {
  /**
   * Options for the MagicString constructor
   */
  sourceMap?: SourceMapOptions
} & (ParserOptions extends undefined
  ? Record<string, never>
  : {
      /**
       * Options passed to the parser
       */
      parser?: ParserOptions
    })

/**
 * Result of a synchronous manipulator callback
 */
type SyncManipulatorResult = void

/**
 * Result of an asynchronous manipulator callback
 */
type AsyncManipulatorResult = Promise<SyncManipulatorResult>

/**
 * Result of a manipulator callback
 */
type ManipulatorResult = SyncManipulatorResult | AsyncManipulatorResult

/**
 * Result of a synchronous modifier run
 */
type SyncModifierResult = {
  readonly code: string
  readonly map: SourceMap
}

/**
 * Result of an asynchronous modifier run
 */
type AsyncModifierResult = Promise<SyncModifierResult>

/**
 * Result of a modifier run, synchronous/asynchronous depending on the parser and manipulator
 */
type ModifierResult<ConcreteParserResult, ConcreteManipulatorResult> =
  ConcreteParserResult extends Promise<any>
    ? AsyncModifierResult
    : ConcreteManipulatorResult extends Promise<any>
    ? AsyncModifierResult
    : SyncModifierResult

/**
 * Helpers for manipulating an AST node
 */
type NodeHelpers<AstNode> = {
  /**
   * Get the original source code of the current AST node
   */
  source(): string

  /**
   * Get the original source code of an AST node
   */
  source(node: AstNode): string

  /**
   * Get an ancestor of the current AST node
   */
  parent(levels?: number): Maybe<AstNode>

  /**
   * Get an ancestor of an AST node
   */
  parent(node: AstNode, levels?: number): Maybe<AstNode>

  /**
   * Replace the source code the current AST node
   */
  override(replacement: string): void

  /**
   * Replace the source code of an AST node
   */
  override(node: AstNode, replacement: string): void
}

/**
 * A callback that manipulates an AST node
 */
type Manipulator<
  AstNode,
  ConcreteManipulatorResult extends ManipulatorResult
> = (node: AstNode, helpers: NodeHelpers<AstNode>) => ConcreteManipulatorResult

/**
 * Check whether a value is a promise
 */
function isPromise(value: any): value is Promise<any> {
  return typeof value === 'object' && typeof value?.then === 'function'
}

/**
 * Create a modifier for a certain language/parser
 *
 * @param config The configuration for the language
 */
export function createModifier<
  AstNode extends Record<string, any>,
  ParserOptions = undefined,
  ConcreteParserResult extends ParserResult<AstNode> = ParserResult<AstNode>
>(config: ParserConfiguration<AstNode, ParserOptions, ConcreteParserResult>) {
  /**
   * The options type of this modifier
   */
  type ConcreteModifierOptions = ModifierOptions<ParserOptions>

  /**
   * An object representing a modifier run by its MagicString
   * instance, its options and its manipulator function
   */
  type Context = {
    magicString: MagicString
    options: ConcreteModifierOptions
    manipulator: Manipulator<AstNode, ManipulatorResult>
  }

  /**
   * This set tracks nodes whose manipulator has finished
   * to allow preventing belated manipulations (e.g. through setTimeout())
   */
  const handledNodes = new WeakSet<AstNode>()

  /**
   * Ensure that a node has not been handled yet
   *
   * @param node The AST node to check
   */
  function ensureNodeIsUnhandled(node: AstNode) {
    if (handledNodes.has(node)) {
      throw new Error(
        `Cannot run helper method after the manipulator callback of iterated or target node has finished running`
      )
    }
  }

  /**
   * Metadata associated with an AST node
   */
  type NodeMetadata = {
    parent: Maybe<AstNode>
    context: Context
  }

  /**
   * A place to store metadata associated with encountered AST nodes
   */
  const nodeMetadataStore = new WeakMap<AstNode, NodeMetadata>()

  /**
   * Collect metadata of an AST
   *
   * @param node    The root node of the tree
   * @param context The modifier context
   */
  function collectTreeMetadata(node: AstNode, context: Context) {
    const childNodes = config.collectChildNodes(node)

    for (const childNode of childNodes) {
      nodeMetadataStore.set(childNode, { parent: node, context })

      collectTreeMetadata(childNode, context)
    }
  }

  /**
   * Get the original source code of an AST node
   *
   * @param node The AST node to get the source code for
   */
  function source(node: AstNode) {
    const { context } = nodeMetadataStore.get(node)!

    const [start, end] = config.getNodeLocation(node)
    return context.magicString.slice(start, end).toString()
  }

  /**
   * Get an ancestor of an AST node
   *
   * @param node   The AST node whose parent to get
   * @param levels The number of levels to go up the AST
   */
  function parent(node: AstNode, levels = 1): Maybe<AstNode> {
    const { parent: parentNode } = nodeMetadataStore.get(node)!

    // No matter how many levels to climb, no parent means undefined
    if (!parentNode) return undefined

    // No levels to go up, return current parent
    if (levels <= 1) return parentNode

    // Recursively get parent node when levels are remaining
    return parent(parentNode, levels - 1)
  }

  /**
   * Replace the source code of an AST node
   *
   * @param node        The AST node to replace
   * @param replacement The replacement code
   */
  function override(node: AstNode, replacement: string) {
    ensureNodeIsUnhandled(node)

    const { context } = nodeMetadataStore.get(node)!

    const [start, end] = config.getNodeLocation(node)
    if (start === end) {
      if (replacement.length === 0) return
      context.magicString.appendRight(start, replacement)
    } else {
      context.magicString.overwrite(start, end, replacement)
    }
  }

  const helpers = { source, parent, override }

  type Helpers = typeof helpers
  type HelperName = keyof Helpers

  /**
   * Take a helper and make its first parameter optional (i.e. allow omitting the AST node)
   */
  type VariadicHelper<T extends (...args: any[]) => any> = T extends (
    node: AstNode,
    ...args: infer U
  ) => infer R
    ? T | ((...args: U) => R)
    : never

  /**
   * Create a function that handles any of the NodeMetadata methods,
   * taking into account a node as an optional first parameter.
   *
   * @param node       The node to bind to the helper method
   * @param helperName The the helper function to invoke
   */
  function createNodeHelper<ConcreteHelperName extends HelperName>(
    node: AstNode,
    helperName: ConcreteHelperName
  ) {
    return (
      ...args: Parameters<VariadicHelper<Helpers[ConcreteHelperName]>>
    ): ReturnType<Helpers[ConcreteHelperName]> => {
      // We need to annihilate typing because TS is just not clever enough
      const helper = helpers[helperName] as any

      if (config.isNode(args[0])) {
        if (helperName === 'override') {
          ensureNodeIsUnhandled(args[0])
        }

        // If first argument is not a node, grab its metadata from
        // the store and execute the according method on that
        return helper(...args)
      } else {
        return helper(node, ...args)
      }
    }
  }

  /**
   * Perform node handling on child nodes in succession
   * This function returns a promise if any of the executed manipulators
   * returns a promise, otherwise it executes synchronously
   *
   * @param node       The node whose child nodes to handle
   * @param childNodes The child nodes to handle
   */
  function performSuccessiveRecursiveWalks(
    node: AstNode,
    childNodes: AstNode[],
    context: Context
  ): ManipulatorResult {
    // Return synchronously when no subwalks are scheduled
    if (childNodes.length === 0) {
      return undefined as any
    }

    const [firstChild, ...remainingChildNodes] = childNodes

    const subwalkResult = handleNode(firstChild, context)

    // When node handling returns a promise, an asynchronous manipulator was called
    // -> wait for it to resolve, then handle next step
    if (isPromise(subwalkResult)) {
      return subwalkResult.then(() =>
        performSuccessiveRecursiveWalks(node, remainingChildNodes, context)
      )
    } else {
      return performSuccessiveRecursiveWalks(node, remainingChildNodes, context)
    }
  }

  /**
   * Walk the AST from the given node and update its descendants
   *
   * @param node    The AST node to start at
   * @param context The modifier context
   */
  function handleNode(node: AstNode, context: Context) {
    // Get subwalks to perform
    const childNodes = config.collectChildNodes(node)
    const subwalksResult = performSuccessiveRecursiveWalks(
      node,
      childNodes,
      context
    )

    // Create the manipulation helpers object
    const nodeHelpers = {
      source: createNodeHelper(node, 'source'),
      parent: createNodeHelper(node, 'parent'),
      override: createNodeHelper(node, 'override')
    }

    // Call manipulator function on AST node
    if (isPromise(subwalksResult)) {
      return subwalksResult
        .then(() => {
          return context.manipulator(node, nodeHelpers)
        })
        .then(manipulatorResult => {
          handledNodes.add(node)
          return manipulatorResult
        })
    } else {
      const manipulatorResult = context.manipulator(node, nodeHelpers)

      if (isPromise(manipulatorResult)) {
        return manipulatorResult.then(result => {
          handledNodes.add(node)
          return result
        })
      } else {
        handledNodes.add(node)
        return manipulatorResult
      }
    }
  }

  /**
   * Create the immutable result of a modifier run
   *
   * @param context The modifier context
   */
  function createResult({ magicString, options }: Context): SyncModifierResult {
    const code = magicString.toString()

    return Object.freeze({
      code,
      map: magicString.generateMap(options.sourceMap),
      toString: () => code
    })
  }

  /**
   * Modify the given source code
   *
   * @param code The code to modify
   * @param manipulator The callback to execute on each node
   */
  function modify<ConcreteManipulatorResult extends ManipulatorResult>(
    code: string,
    manipulator: Manipulator<AstNode, ConcreteManipulatorResult>
  ): ModifierResult<ConcreteParserResult, ConcreteManipulatorResult>

  /**
   * Modify the given source code
   *
   * @param code The code to modify
   * @param options The modifier options
   * @param manipulator The callback to execute on each node
   */
  function modify<ConcreteManipulatorResult extends ManipulatorResult>(
    code: string,
    options: ConcreteModifierOptions,
    manipulator: Manipulator<AstNode, ConcreteManipulatorResult>
  ): ModifierResult<ConcreteParserResult, ConcreteManipulatorResult>

  function modify<ConcreteManipulatorResult extends ManipulatorResult>(
    code: string,
    ...args: any[]
  ): ModifierResult<ConcreteParserResult, ConcreteManipulatorResult> {
    /**
     * The result type of this modifier run
     */
    type ConcreteModifierResult = ModifierResult<
      ConcreteParserResult,
      ConcreteManipulatorResult
    >

    let options: ConcreteModifierOptions
    let manipulator: Manipulator<AstNode, ConcreteManipulatorResult>

    // If the first addtional argument is a function, the modifier is called without options
    if (typeof args[0] === 'function') {
      options = {} as ConcreteModifierOptions
      manipulator = args[0]
    } else {
      options = args[0]
      manipulator = args[1]
    }

    const parsedCode = config.parse(code, (options as any).parser)

    /**
     * Traverse the AST and modify it
     */
    function walkTree(tree: AstNode): ConcreteModifierResult {
      // Create the resource all manipulations are performed on
      const magicString = new MagicString(code)

      // Create a context object that can be passed to helpers
      const context = { magicString, options, manipulator }

      // Preparation: collect metadata of the whole AST
      // Allows to modify nodes that have not been visited yet
      nodeMetadataStore.set(tree, { parent: undefined, context })

      collectTreeMetadata(tree, context)

      // Start the recursive walk
      const modifierResult = handleNode(tree, context)

      if (isPromise(modifierResult)) {
        return modifierResult.then(() =>
          createResult(context)
        ) as ConcreteModifierResult
      } else {
        return createResult(context) as ConcreteModifierResult
      }
    }

    if (config.isNode(parsedCode)) {
      // Parsing was synchronous, return the result synchronously
      return walkTree(parsedCode as SyncParserResult<AstNode>)
    } else {
      // Parsing was asynchronous, return a Promise
      return (parsedCode as AsyncParserResult<AstNode>).then(program =>
        walkTree(program)
      ) as ModifierResult<ConcreteParserResult, ConcreteManipulatorResult>
    }
  }

  return { modify, source, parent, override }
}
