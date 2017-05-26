/* @flow */
import {describe, it} from 'mocha'
import {random} from 'faker'
import assert from 'assert'

describe('logger', () => {
  it('error', () => {
    const error = require('../src/lib/logger').error
    assert(error(new Error()) === undefined)
    assert(error(random.word()) === undefined)
  })

  it('warning', () => {
    const warning = require('../src/lib/logger').warning
    assert(warning(new Error()) === undefined)
    assert(warning(random.word()) === undefined)
  })
})
