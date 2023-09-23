# `@codepatch/core`

> Make small changes to your code the easy way

This package is the architectural core of the [Codepatch](https://github.com/loilo/codepatch) family of tools.
It provides the foundation and unified API for tools like [`@codepatch/javascript`](https://github.com/loilo/codepatch/tree/main/packages/javascript) or [`@codepatch/php`](https://github.com/loilo/codepatch/tree/main/packages/php).

## Installation

**NOTE:** This package is not intended to be used directly. It should be used a dependency of a Codepatch modifier implementation.

```
npm install @codepatch/core
```

**IMPORTANT:** `@codepatch/core` is an ESM-only package. [Read more.](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)

## Usage

`@codepatch/core` exports the `createModifier` function that allows creating a Codepatch modifier implementation by passing it a configuration object with four methods:

- `parse(code, options)` – Parse the `code` string into an AST. The `options` object is what users of your modifier pass as the `parser` option and thus is optional.
- `isNode(value)` – Check whether a value from inside the AST is a node.
- `collectChildNodes(node)` – Given a node, return an array of its child nodes.
- `getNodeLocation(node)` – From a node, get a two-item array with the node's start and end position (as offset characters) in the originally parsed code.

To improve type safety of your modifiers for your users, you can take a look at how the Codepatch modifiers utilize TypeScript.

## Related

`@codepatch/core` is part of the Codepatch family of tools. Codepatch is a collection of tools that make it easy to programmatically make simple modifications to code of various languages.

Check out the [Codepatch repository](https://github.com/loilo/codepatch) to find tools for other languages or information about how to write your own Codepatch modifier.
