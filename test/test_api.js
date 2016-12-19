'use strict'

const assert = require('power-assert')
const http = require('http')
const fs = require('fs')
const path = require('path')
const remove = require('remove')

const utils = require('../lib/utils')
const api = require('../api')

describe('api', function () {
  let testUrlHost
  const testUrlWithoutViewport = '/'
  const testHtmlWitouthViewport = '<!DOCTYPE html><html><head></head><body></body></html>'
  const testUrlWithViewport = '/with-viewport/'
  const testHtmlWithViewport = `
  <!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
  </head><body></body></html>
  `
  const testUrlWithJSViewport = '/with-viewport-js/'
  const testHtmlWithJSViewport = `
  <!DOCTYPE html><html>
    <head>
      <script>
        document.onreadystatechange = function() {
          if (document.readyState == "interactive") {
            var meta = document.createElement("meta");
            meta.setAttribute("name", "viewport");
            meta.setAttribute("content", "width=device-width,initial-scale=1.0");
            document.getElementsByTagName("head")[0].appendChild(meta);
          }
        }
      </script>
    </head>
    <body>a</body>
  </html>
  `
  const TEST_STORE_DIR = '/tmp/_margaux/_margaux_test'

  before(function (done) {
    utils.emptyPorts((err, emptyPorts) => {
      assert(err === null)
      const httpPort = emptyPorts[0]
      http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
        switch (req.url) {
          case testUrlWithViewport:
            res.end(testHtmlWithViewport)
            break
          case testUrlWithoutViewport:
            res.end(testHtmlWitouthViewport)
            break
          case testUrlWithJSViewport:
            res.end(testHtmlWithJSViewport)
            break
          default:
            res.end('')
            break
        }
      }).listen(httpPort)
      testUrlHost = 'http://localhost:' + httpPort
      done()
    })
  })

  it('returns html without viewport', function (done) {
    api.takeWebSnapshot(testUrlHost + testUrlWithoutViewport, {},
      TEST_STORE_DIR, function (err, url, viewport) {
        if (err) {
          assert(err === null)
          throw err
        }
        assert(url.length > 0)
        assert(fs.existsSync(`${path.join(TEST_STORE_DIR, url)}`))
        assert.equal(viewport, '')
        done()
      })
  })

  it('returns html with viewport', function (done) {
    api.takeWebSnapshot(testUrlHost + testUrlWithViewport, {},
      TEST_STORE_DIR, function (err, url, viewport) {
        if (err) {
          assert(err === null)
          throw err
        }
        assert(url.length > 0)
        assert(fs.existsSync(`${path.join(TEST_STORE_DIR, url)}`))
        assert.equal(viewport, 'width=device-width,initial-scale=1')
        done()
      })
  })

  it('returns html with js viewport', function (done) {
    api.takeWebSnapshot(testUrlHost + testUrlWithJSViewport, {},
      TEST_STORE_DIR, function (err, url, viewport) {
        if (err) {
          assert(err === null)
          throw err
        }
        assert(url.length > 0)
        assert(fs.existsSync(`${path.join(TEST_STORE_DIR, url)}`))
        assert.equal(viewport, 'width=device-width,initial-scale=1.0')
        done()
      })
  })

  const TEST_MARGAUX_TXT = '/tmp/_margaux_test.txt'
  const TEST_MARGAUX_OK = 'OK'
  const TEST_MARGAUX_NG = 'NG'
  const TEST_MARGAUX_CHECK_URL = 'http://localhost/tmp/margaux_check.txt'

  it('returns 200 when filesystem is OK.', function (done) {
    fs.writeFileSync(TEST_MARGAUX_TXT, TEST_MARGAUX_OK)
    api.ping(TEST_MARGAUX_TXT, TEST_MARGAUX_OK, TEST_MARGAUX_CHECK_URL, function (err) {
      if (err) {
        throw err
      }
    })
    remove.removeSync(TEST_MARGAUX_TXT)
    done()
  })

  it('returns 500 when filesystem is NG1.', function (done) {
    fs.writeFileSync(TEST_MARGAUX_TXT, TEST_MARGAUX_NG)

    api.ping(TEST_MARGAUX_TXT, TEST_MARGAUX_OK, TEST_MARGAUX_CHECK_URL, function (err) {
      if (!err) {
        assert(false)
      }
    })
    remove.removeSync(TEST_MARGAUX_TXT)
    done()
  })

  it('returns 500 when filesystem is NG2.', function (done) {
    api.ping(TEST_MARGAUX_TXT, TEST_MARGAUX_OK, TEST_MARGAUX_CHECK_URL, function (err) {
      if (!err) {
        assert(false)
      }
    })
    done()
  })

  it('raises errors.NotPermittedError when directory traversal.',
    function (done) {
      api.takeWebSnapshot(testUrlHost + testUrlWithJSViewport,
        {saveDir: '../../a'},
      TEST_STORE_DIR, function (err, url, viewport) {
        assert.equal(err.name, 'NotPermittedError')
        done()
      })
    })

  after(function (done) {
    remove.removeSync(TEST_STORE_DIR)
    done()
  })
})
