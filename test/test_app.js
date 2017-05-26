/* @flow */
import {describe, it, before} from 'mocha'
import assert from 'assert'
import request from 'supertest'
import http from 'http'

describe('POST /', function () {
  const app = require('../src/app').default
  const testHtml = `<!DOCTYPE html><html><body><head></head></body></html>`

  before(done => {
    const emptyPorts = require('../src/lib/utils').emptyPorts
    // crawl 対象となるテストサーバーを起動する
    emptyPorts((err, emptyPorts) => {
      assert(err === null)
      const httpPort = emptyPorts[0]
      http
        .createServer(function (req, res) {
          res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
          res.end(req.url === '/' ? testHtml : '')
        })
        .listen(httpPort)
      done()
    })
  })

  it('returns 404 if request uri is not found', function (done) {
    request(app).get('/not_found_uri').expect(404, done)
  })
})
