/* @flow */
import {describe, it} from 'mocha'
import assert from 'assert'
import errors from 'common-errors'
const fs = require('fs')
const remove = require('remove')

describe('libPath.saveFile', function () {
  const libPath = require('../src/lib/path')

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
  const libPath = require('../src/lib/path')

  it('should read file', function (done) {
    const path = '/tmp/_margaux/test/test_path/xxxx'
    libPath.readFile(path, (err, text) => {
      assert(err === null)
      assert.ok(text)
      done()
    })
  })

  it('should not read path empty string', function (done) {
    const path = ''
    libPath.readFile(path, err => {
      assert(err instanceof errors.io.FileNotFoundError)
      done()
    })
  })

  it('should not read text file empty string', function (done) {
    const path = '/tmp/_margaux/test/test_path/empty.txt'
    fs.writeFileSync(path, '')
    libPath.readFile(path, err => {
      if (!err) {
        assert(false)
      }
      remove.removeSync(path)
      done()
    })
  })
})
