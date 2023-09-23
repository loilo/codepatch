# `@codepatch/php`

> Make small changes to your PHP code the easy way

## Installation

```
npm install @codepatch/php
```

**IMPORTANT:** `@codepatch/php` is an ESM-only package. [Read more.](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)

## Motivation

`@codepatch/php` is the ideal tool for programmatically making small & simple modifications to your PHP code in JavaScript. It works by parsing the code into an [AST](http://en.wikipedia.org/wiki/Abstract_syntax_tree) and then overriding parts of it.

As an introducing example, let's put a function wrapper around all array literals:

```javascript
import { modify } from '@codepatch/php'

const code = `
$xs = [1, 2, [3, 4]];
$ys = [5, 6];
var_dump([$xs, $ys]);
`

const result = modify(code, (node, { source, override }) => {
  if (node.kind === 'array') {
    override(`wrap(${source()})`)
  }
})

console.log(result.code)
```

Output:

```php
$xs = wrap([1, 2, wrap([3, 4])]);
$ys = wrap([5, 6]);
var_dump(wrap([$xs, $ys]));
```

## Usage

### How it Works

```ts
function modify(code, options = {}, manipulator)
```

Transform the `code` string with the function `manipulator`, returning an output object.

For every node in the AST, `manipulator(node, helpers)` is called. The recursive walk is an
[in-order, depth-first traversal](https://en.wikipedia.org/wiki/Tree_traversal#In-order,_LNR), so children are handled before their parents. This makes it easier to write manipulators that perform nested transformations as transforming parents often requires transforming their children first anyway.

The `modify()` return value is an object with two properties:

- `code` – contains the transformed source code
- `map` – holds the resulting source map object, [as generated by `magic-string`](https://www.npmjs.com/package/magic-string#sgeneratemap-options-)

Type casting a Codepatch result object will return its source `code`.

> **Pro Tip:**
> Don't know how a PHP AST looks like? Have a look at [astexplorer.net](https://astexplorer.net/) to get an idea.

### Options

All options are, as the name says, optional. If you want to provide an options object, its place is between the `code` string and the `manipulator` function.

#### `php-parser` Options

Any options for the underlying [`php-parser`](https://npmjs.com/package/php-parser) can be passed to `options.parser`:

```js
const options = {
  parser: {
    lexer: { short_tags: true }
  }
}

modify(code, options, (node, helpers) => {
  // Allow short <? opening tag
})
```

#### Parse Mode

There are two parse modes available: `code` and `eval`. The default is `eval`.

The `code` parse mode allows to parse PHP code as it appears "in the wild", i.e. with enclosing `<?php` tags. The default `eval` mode only parses pure PHP code, with no enclosing tags.

```js
const options = {
  parser: {
    parseMode: 'code'
  }
}

modify('<!doctype html><?= "Hello World!" ?>', options, (node, helpers) => {
  // Parse the `source` as mixed HTML/PHP code
})
```

#### Source Maps

Codepatch uses [`magic-string`](https://www.npmjs.com/package/magic-string) under the hood to generate [source maps](https://developer.mozilla.org/docs/Tools/Debugger/How_to/Use_a_source_map) for your code modifications. You can pass its [source map options](https://www.npmjs.com/package/magic-string#sgeneratemap-options-) as `options.sourceMap`:

```js
const options = {
  sourceMap: {
    hires: true
  }
}

modify(code, options, (node, helpers) => {
  // Create a high-resolution source map
})
```

### Helpers

The `helpers` object passed to the `manipulator` function exposes three methods. All of these methods handle the _current AST node_ (the one that has been passed to the manipulator as its first argument).

However, each of these methods takes an AST node as an optional first parameter if you want to access other nodes.

> **Example:**
>
> ```js
> modify('$x = 1', (node, { source }) => {
>   if (node.kind === 'assign') {
>     // `node` refers to the `$x = 1` Expression
>     source() // returns "$x = 1"
>     source(node.right) // returns "1"
>   }
> })
> ```

#### `source()`

Return the source code for the given node, including any modifications made to
child nodes:

```js
modify('(true)', (node, { source, override }) => {
  if (node.kind === 'boolean') {
    source() // returns "true"
    override('false')
    source() // returns "false"
  }
})
```

#### `override(replacement)`

Replace the source of the affected node with the `replacement` string:

```js
const result = modify('4 + 2', (node, { source, override }) => {
  if (node.kind === 'bin') {
    override(source(node.left) + source(node.right))
  }
})

console.log(result.code)
```

Output:

```php
42
```

#### `parent(levels = 1)`

From the starting node, climb up the syntax tree `levels` times. Getting an ancestor node of the program root yields `undefined`.

```js
modify('$x = [1]', (node, { parent }) => {
  if (node.kind === 'number') {
    // `node` refers to the `1` literal
    parent() // same as parent(1), refers to the `1` array item
    parent(2) // refers to the `[1]` expression
    parent(3) // refers to the `x = [1]` assignment expression
    parent(4) // refers to the `x = [1]` statement
    parent(5) // refers to the program as a whole (root node)
    parent(6) // yields `undefined`, same as parent(7), parent(8) etc.
  }
})
```

#### External Helper Access

If you want to extract manipulation behavior into standalone functions, you can import the helpers directly from the `@codepatch/php` package, where they are not bound to a specific node:

```js
import { override } from '@codepatch/php'

// Standalone function, increments node's value if it's a number
const increment = node => {
  if (node.kind === 'number') {
    override(node, String(Number(node.value) + 1))
  }
}

const result = modify('$x = 1', node => {
  increment(node)
})

console.log(result.code)
```

Output:

```js
$x = 2
```

### Asynchronous Manipulations

The `manipulator` function may return a [Promise](https://developer.mozilla.org/docs/Web/php/Reference/Global_Objects/Promise). If it does, Codepatch will wait for that to resolve, making the whole `modify()` function return a Promise resolving to the result object (instead of returning the result object directly):

```js
const code = `
$content = curl("https://example.com")
`

const deferredResult = modify(code, async (node, { source, override }) => {
  if (
    node.kind === 'call' &&
    node.what.kind === 'name' &&
    node.what.name === 'curl'
  ) {
    // Replace all cUrl calls with their actual content

    // Get the URL (will only work for simple string literals)
    const url = node.arguments[0].value

    // Fetch the URL's contents
    const contents = (await got(url)).body

    // Replace the curl() call with the fetched contents
    override(JSON.stringify(contents))
  }
})

// Result is not available immediately, we need to await it
deferredResult.then(result => {
  console.log(result.code)
})
```

Output:

```php
$content = "<!doctype html>\n<html>\n[...]\n</html>"
```

> **Note:** You _have_ to return a Promise if you want to commit updates asynchronously. Once the manipulator function is done running, any `override()` calls originating from it will throw an error.

## Related

`@codepatch/php` is part of the Codepatch family of tools. Codepatch is a collection of tools that make it easy to programmatically make simple modifications to code of various languages.

Check out the [Codepatch repository](https://github.com/loilo/codepatch) to find tools for other languages or information about how to write your own Codepatch modifier.