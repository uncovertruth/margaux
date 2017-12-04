/* @flow */
import { describe, it } from 'mocha'
import assert from 'assert'
import request from 'superagent'

describe('utils', () => {
  const html = `<html><head></head><body>hello</body></html>`
  const { createTmpServer } = require('../../src/lib/utils')

  it('return server', done => {
    createTmpServer(html, {}, (err, server) => {
      if (err) {
        throw err
      }
      request
        .get('http://localhost:' + server.address().port)
        .end((err, res) => {
          if (err) {
            throw err
          }
          assert.ok(res.headers['accept-language'] === 'ja')
          server.close(done)
        })
    })
  })

  it('can specify accept language', done => {
    createTmpServer(html, { acceptLanguage: 'en' }, (err, server) => {
      if (err) {
        throw err
      }
      request
        .get('http://localhost:' + server.address().port)
        .end((err, res) => {
          if (err) {
            throw err
          }
          assert.ok(res.headers['accept-language'] === 'en')
          server.close(done)
        })
    })
  })

  const { getGoogleChromeBin } = require('../../src/lib/utils')
  it('return Google Chrome binary', function () {
    const chromeBinary = getGoogleChromeBin()
    const bin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    assert(chromeBinary, bin)
  })

  const { runChromeBrowsers } = require('../../src/lib/utils')
  it('run Google Chrome browser without ports', done => {
    runChromeBrowsers([], err => {
      assert(!err)
      done()
    })
  })

  it('run Google Chrome browser with ports', done => {
    runChromeBrowsers([9222, 9223, 9224, 9225], err => {
      assert(!err)
      done()
    })
  })
})
