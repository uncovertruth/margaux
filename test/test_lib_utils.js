/* @flow */
import { describe, it } from 'mocha'
import assert from 'assert'
import request from 'superagent'

describe('utils.createTmpServer', () => {
  const utils = require('../lib/utils')
  const html = '<html><head></head><body>hello</body></html>'

  it('return server', (done) => {
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

  it('return Google Chrome binary', function (done) {
    const chromeBinary = utils.getGoogleChromeBin()
    const bin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    assert(chromeBinary, bin)
    done()
  })

  it('run Google Chrome browser without ports', function (done) {
    utils.runChromeBrowsers([], (err) => {
      assert(err === undefined)
    })
    done()
  })

  it('run Google Chrome browser with ports', function (done) {
    utils.runChromeBrowsers([9222, 9223, 9224, 9225], (err) => {
      assert(err === undefined)
    })
    done()
  })
})
