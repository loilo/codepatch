<div align="center">
  <img src="codepatch.svg" width="220" height="220" alt="">

# Codepatch

</div>

Codepatch is a collection of tools that make it easy to programmatically make simple modifications to code of various languages. It consists of a core library ([`@codepatch/core`](https://github.com/loilo/codepatch/tree/main/packages/core)) and a set of language-specific packages that are built on top of it.

## Motivation

In Node.js (or any server-side JavaScript runtime, really), making programmatic modifications to code is a common but tedious task.

It can be done the easy way — through simple string replacements — but this is unreliable and often unsafe.

Doing it properly though (by parsing the code into an [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree), modifying the AST, and then generating code from the modified AST) tends to be a lot of work. Sometimes it's even straight-up impossible as there are languages that have a parser written in JavaScript, but no according code generator.

Codepatch is tailored to make small & simple code modifications easy while not targeting more complex scenarios at all, so it aims to hit a middle ground between these two approaches. To achieve this, Codepatch parses the code into an AST, but instead of modifying the AST, it allows you to override individual AST nodes with new code snippet strings directly. Just like a patch on a piece of cloth.

### Example

Here's an example of how this approach works, using [`@codepatch/javascript`](https://github.com/loilo/codepatch/tree/main/packages/javascript) to add `.js` extensions to all relative imports in a JavaScript module:

```js
import { modify } from '@codepatch/javascript'

const original = `
import foo from 'bar'
import baz from './qux'
`

const result = modify(
  original,
  { parser: { sourceType: 'module' } },
  (node, { source, parent, override }) => {
    if (
      // For patching, only consider (string) literals...
      node.type === 'Literal' &&
      // ...which are the 'source' property of their parent...
      parent().source === node &&
      // ...which itself is either an import or export.
      [
        'ImportExpression',
        'ImportDeclaration',
        'ExportAllDeclaration',
        'ExportNamedDeclaration'
      ].includes(parent().type) &&
      // The literal must not already have a .js extension...
      !node.value.endsWith('.js') &&
      // ...and needs to be a relative path.
      (node.value.startsWith('./') || node.value.startsWith('../'))
    ) {
      // Override the node with the same string, but with a .js extension
      override(node.raw.slice(0, -1) + '.js' + node.raw.slice(-1))
    }
  }
)

console.log(result.code)
```

> **Tip:** To simplify following along the code above, you can have a look at [the handled JavaScript code's AST](https://astexplorer.net/#/gist/54f993675fef79ca0e4f41080b57ea52/9e12658595d9b19d7a6b4b4de8369e377985f92d).

Output:

```js
import foo from 'bar'
import baz from './qux.js'
```

## Official Modifiers

For now, the Codepatch project provides modifiers for the following languages:

<!-- prettier-ignore -->
Language | Parser | Package
-|-|-
JavaScript | [Acorn](https://github.com/acornjs/acorn) | [`@codepatch/javascript`](https://github.com/loilo/codepatch/tree/main/packages/javascript)
CSS | [CSSTree](https://github.com/csstree/csstree) | [`@codepatch/css`](https://github.com/loilo/codepatch/tree/main/packages/css)
HTML | [htmlparser2](https://github.com/fb55/htmlparser2) | [`@codepatch/html`](https://github.com/loilo/codepatch/tree/main/packages/html)
PHP | [PHP Parser](https://github.com/glayzzle/php-parser) | [`@codepatch/php`](https://github.com/loilo/codepatch/tree/main/packages/php)

## Implementing a Modifier

Using [`@codepatch/core`](https://github.com/loilo/codepatch/tree/main/packages/core) to implement a modifier for any other language is near trivial. Everything you need is a JavaScript-based parser for that language and the instructions in the core package.
