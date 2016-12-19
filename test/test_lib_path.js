'use strict'

const assert = require('power-assert')
const errors = require('common-errors')

const libPath = require('../lib/path')

describe('libPath.saveFile', function () {
  it('shoule save file', function (done) {
    const path = '/tmp/_margaux/test/test_path/xxxx'
    const html = '<html></html>'
    libPath.saveFile(path, html, function (err) {
      assert.ok(err === null)
      done()
    })
  })

  it('shoule not save file empty string', function (done) {
    const path = '/tmp/_margaux/test/test_path/xxxx'
    const html = ''
    libPath.saveFile(path, html, function (err) {
      assert.ok(err instanceof errors.ArgumentNullError)
      done()
    })
  })
})

describe('libPath.readFile', function () {
  it('should read file', function (done) {
    const path = '/tmp/_margaux/test/test_path/xxxx'
    libPath.readFile(path, (err, text) => {
      assert(err === null)
      assert.ok(text)
      done()
    })
  })
})
