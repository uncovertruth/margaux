'use strict'

const assert = require('power-assert')
const request = require('superagent')
const utils = require('../lib/utils')

describe('utils.createTmpServer', () => {
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
})
