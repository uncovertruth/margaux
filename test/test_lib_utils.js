/* @flow */
import { describe, it } from 'mocha'
import assert from 'assert'
import request from 'superagent'

describe('utils', () => {
  const html = `<html><head></head><body>hello</body></html>`

  it('return server', (done) => {
    const utils = require('../src/lib/utils').default
    utils.createTmpServer(html, {}, (err, server) => {
      if (err) {
        throw err
      }
      request.get('http://localhost:' + server.address().port).end((err, res) => {
        if (err) {
          throw err
        }
        assert.ok(res.headers['accept-language'] === 'ja')
        server.close(done)
      })
    })
  })

  it('can specify accept language', (done) => {
    const utils = require('../src/lib/utils').default
    utils.createTmpServer(html, {acceptLanguage: 'en'}, (err, server) => {
      if (err) {
        throw err
      }
      request.get('http://localhost:' + server.address().port).end((err, res) => {
        if (err) {
          throw err
        }
        assert.ok(res.headers['accept-language'] === 'en')
        server.close(done)
      })
    })
  })

  it('return Google Chrome binary', function () {
    const getGoogleChromeBin = require('../src/lib/utils').getGoogleChromeBin
    const chromeBinary = getGoogleChromeBin()
    const bin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    assert(chromeBinary, bin)
  })

  it('run Google Chrome browser without ports', function () {
    const runChromeBrowsers = require('../src/lib/utils').runChromeBrowsers
    runChromeBrowsers([], (err) => {
      assert(err === undefined)
    })
  })

  it('run Google Chrome browser with ports', function () {
    const runChromeBrowsers = require('../src/lib/utils').runChromeBrowsers
    runChromeBrowsers([9222, 9223, 9224, 9225], (err) => {
      assert(err === undefined)
    })
  })
})
