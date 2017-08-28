/* @flow */
import { describe, it } from 'mocha'
import { random } from 'faker'
import assert from 'assert'

describe('logger', () => {
  const { error, warning } = require('../../src/lib/logger')
  it('error', () => {
    assert(error(new Error()) === undefined)
    assert(error(random.word()) === undefined)
  })

  it('warning', () => {
    assert(warning(new Error()) === undefined)
    assert(warning(random.word()) === undefined)
  })
})
