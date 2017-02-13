/* @flow */
import { describe, it, before } from 'mocha'
import assert from 'assert'
import request from 'supertest'
import http from 'http'

describe('POST /', function () {
  const utils = require('../src/lib/utils')
  const app = require('../src/app')
  const testHtml = '<!DOCTYPE html><html><body><head></head></body></html>'

  before(function (done) {
    // crawl 対象となるテストサーバーを起動する
    utils.emptyPorts((err, emptyPorts) => {
      assert(err === null)
      const httpPort = emptyPorts[0]
      http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
        res.end(req.url === '/' ? testHtml : '')
      }).listen(httpPort)
      done()
    })
  })

  it('returns 404 if request uri is not found', function (done) {
    request(app)
      .get('/not_found_uri')
      .expect(404, done)
  })
})
