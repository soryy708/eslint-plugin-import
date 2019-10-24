import { test as _test, testFilePath } from '../utils'

import { RuleTester } from 'eslint'
import flat from 'array.prototype.flat'

const ruleTester = new RuleTester()
    , rule = require('rules/no-cycle')

const error = message => ({ ruleId: 'no-cycle', message })

const test = def => _test(Object.assign(def, {
  filename: testFilePath('./cycles/depth-zero.js'),
}))

const testDialects = ['es6'];

ruleTester.run('no-cycle', rule, {
  valid: [
    // this rule doesn't care if the cycle length is 0
    test({ code: 'import foo from "./foo.js"'}),

    test({ code: 'import _ from "lodash"' }),
    test({ code: 'import foo from "@scope/foo"' }),
    test({ code: 'var _ = require("lodash")' }),
    test({ code: 'var find = require("lodash.find")' }),
    test({ code: 'var foo = require("./foo")' }),
    test({ code: 'var foo = require("../foo")' }),
    test({ code: 'var foo = require("foo")' }),
    test({ code: 'var foo = require("./")' }),
    test({ code: 'var foo = require("@scope/foo")' }),
    test({ code: 'var bar = require("./bar/index")' }),
    test({ code: 'var bar = require("./bar")' }),
    test({
      code: 'var bar = require("./bar")',
      filename: '<text>',
    }),

    ...flat(testDialects.map(testDialect => [
      test({
        code: `import { foo } from "./${testDialect}/depth-two"`,
        options: [{ maxDepth: 1 }],
      }),
      test({
        code: `import { foo, bar } from "./${testDialect}/depth-two"`,
        options: [{ maxDepth: 1 }],
      }),
      test({
        code: `import("./${testDialect}/depth-two").then(function({ foo }){})`,
        options: [{ maxDepth: 1 }],
        parser: require.resolve('babel-eslint'),
      }),
      test({
        code: `import type { FooType } from "./${testDialect}/depth-one"`,
        parser: require.resolve('babel-eslint'),
      }),
      test({
        code: `import type { FooType, BarType } from "./${testDialect}/depth-one"`,
        parser: require.resolve('babel-eslint'),
      }),
    ])),
  ],
  invalid: [
    ...flat(testDialects.map(testDialect => [
      test({
        code: `import { foo } from "./${testDialect}/depth-one"`,
        errors: [error(`Dependency cycle detected.`)],
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-one"`,
        options: [{ maxDepth: 1 }],
        errors: [error(`Dependency cycle detected.`)],
      }),
      test({
        code: `const { foo } = require("./${testDialect}/depth-one")`,
        errors: [error(`Dependency cycle detected.`)],
        options: [{ commonjs: true }],
      }),
      test({
        code: `require(["./${testDialect}/depth-one"], d1 => {})`,
        errors: [error(`Dependency cycle detected.`)],
        options: [{ amd: true }],
      }),
      test({
        code: `define(["./${testDialect}/depth-one"], d1 => {})`,
        errors: [error(`Dependency cycle detected.`)],
        options: [{ amd: true }],
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-two"`,
        errors: [error(`Dependency cycle via ./depth-one:1`)],
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-two"`,
        options: [{ maxDepth: 2 }],
        errors: [error(`Dependency cycle via ./depth-one:1`)],
      }),
      test({
        code: `const { foo } = require("./${testDialect}/depth-two")`,
        errors: [error(`Dependency cycle via ./depth-one:1`)],
        options: [{ commonjs: true }],
      }),
      test({
        code: `import { two } from "./${testDialect}/depth-three-star"`,
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
      }),
      test({
        code: `import one, { two, three } from "./${testDialect}/depth-three-star"`,
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
      }),
      test({
        code: `import { bar } from "./${testDialect}/depth-three-indirect"`,
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
      }),
      test({
        code: `import { bar } from "./${testDialect}/depth-three-indirect"`,
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
        parser: require.resolve('babel-eslint'),
      }),
      test({
        code: `import("./${testDialect}/depth-three-star")`,
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
        parser: require.resolve('babel-eslint'),
      }),
      test({
        code: `import("./${testDialect}/depth-three-indirect")`,
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
        parser: require.resolve('babel-eslint'),
      }),
    ])),
  ],
})
