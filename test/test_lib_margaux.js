/* @flow */
import { describe, it } from 'mocha'
import { random } from 'faker'
import _ from 'lodash'
import assert from 'assert'
import co from 'co'
import promisify from 'es6-promisify'
import errors from 'common-errors'

import { COOKIE_EXPIRES } from '../src/const'

describe('lib/margaux', () => {
  const host = 'localhost'
  const port = 9223
  const margaux = require('../src/lib/margaux')
  const createTmpServer = promisify(require('../src/lib/utils').createTmpServer)

  it('close', done => {
    margaux.create(host, port, (err, client) => {
      assert(err === null)
      margaux.close(client, (err, res) => {
        assert(err === null)
        assert(res)
        done()
      })
    })
  })

  it('setDeviceMetricsOver', done => {
    margaux.create(host, port, (err, client) => {
      assert(!err)
      margaux.setDeviceMetricsOver(
        client,
        {
          height: random.number(),
          width: random.number()
        }
      )
      done()
    })
  })

  it('setUserAgentOverride', done => {
    const UA = require('../src/const').USER_AGENT
    margaux.create(host, port, (err, client) => {
      assert(!err)
      margaux.setUserAgentOverride(client, { userAgent: UA })
      done()
    })
  })

  it('setHeaders', done => {
    margaux.create(host, port, (err, client) => {
      assert(!err)
      margaux.setHeaders(client, random.alphaNumeric(), () => {
        done()
      })
    })
  })

  it('removeScripts', done => {
    margaux.create(host, port, (err, client) => {
      assert(!err)
      margaux.removeScripts(client, err => {
        assert(!err)
        done()
      })
    })
  })

  it('emptyIframes', done => {
    margaux.create(host, port, (err, client) => {
      assert(!err)
      margaux.emptyIframes(client, (err, res) => {
        assert(!err)
        done()
      })
    })
  })

  it('evaluate', done => {
    assert(typeof margaux.evaluate === 'function')

    margaux.create(host, port, (err, client: any) => {
      assert(!err)
      client._ws.on('close', (result) => {
        // 本来は1000の正常終了だったが、いつのバージョンからかChromeがwindow.closeだと異常終了を返すようになった。
        // closeのテストではなく、evaluateのテストなので異常終了を正とする。
        // 正常系では影響がないが、延々終わらない異常系でこの方式を使ってchromeを閉じているので問題がないわけではない。
        assert(result === 1006, '異常終了')
      })

      const expression = 'setTimeout(window.close,  5)'
      margaux.evaluate(client, expression, (err, result) => {
        assert(!err)
        assert(result)
        done()
      })
    })
  })

  it('(get|set|delete)Cookies', function (done) {
    const script = `
      if (document.cookie.indexOf('test=1') > -1) {
        var span = document.createElement('span');
        document.body.appendChild(span);
      }
    `

    const html = require('util').format(
      '<html><head></head><body><script>%s</script></body></html>',
      script
    )
    const create = promisify(margaux.create)
    const navigate = promisify(margaux.navigate)
    const deleteCookie = promisify(margaux.deleteCookie)
    const setCookie = promisify(margaux.setCookie)
    const getCookies = promisify(margaux.getCookies)
    const getOuterHTML = promisify(margaux.getOuterHTML)

    co(function * () {
      // テストサーバーへ画面遷移
      const server = yield createTmpServer(html, {})
      const chrome = yield create('localhost', 9223)
      yield navigate(chrome, 'http://localhost:' + server.address().port)

      let outerHTML = yield getOuterHTML(chrome)
      assert.ok(outerHTML === html, 'まだ cookie が存在していない')

      // set and get
      yield setCookie(chrome, {cookieName: 'test', value: '12345'})
      const result = yield getCookies(chrome, {})

      // 取得した連想配列にセットした cookie が存在するかを確認
      assert.ok(_.filter(result.cookies, {
        domain: 'localhost', name: 'test', value: '12345'
      }).length === 1)

      yield navigate(chrome, 'http://localhost:' + server.address().port)
      outerHTML = yield getOuterHTML(chrome)
      assert.ok(outerHTML !== html, '要素が追加された')

      // cookie を綺麗にしておく
      yield deleteCookie(chrome, { cookieName: 'test', url: 'http://localhost/' })

      yield navigate(chrome, 'http://localhost:' + server.address().port)
      outerHTML = yield getOuterHTML(chrome)
      assert.ok(outerHTML === html, 'cookie が削除されて')
    }).then(done).catch((e) => { throw e })
  })

  it('should not set cookie without cookie name', function () {
    const chrome = createTmpServer('', {})
    const cookieOpts = {
      cookieName: '',
      value: 12345,
      expires: COOKIE_EXPIRES
    }
    margaux.setCookie(chrome, cookieOpts, (err: any) => {
      assert(err instanceof errors.ArgumentNullError)
      assert(err.message === 'Missing argument: cookieName')
    })
  })

  it('should not set cookie without value name', function () {
    const chrome = createTmpServer('', {})
    const cookieOpts = {
      cookieName: 'test',
      value: '',
      expires: COOKIE_EXPIRES
    }
    margaux.setCookie(chrome, cookieOpts, (err: any) => {
      assert(err instanceof errors.ArgumentNullError)
      assert(err.message === 'Missing argument: value')
    })
  })

  it('should not delete cookie without cookieName', function () {
    const chrome = createTmpServer('', {})
    const cookieOpts = {
      cookieName: '',
      url: 'http://localhost/'
    }
    margaux.deleteCookie(chrome, cookieOpts, (err: any) => {
      assert(err instanceof errors.ArgumentNullError)
      assert(err.message === 'Missing argument: cookieName')
    })
  })

  it('should not delete cookie without url', function () {
    const chrome = createTmpServer('', {})
    const cookieOpts = {
      cookieName: 'test',
      url: ''
    }
    margaux.deleteCookie(chrome, cookieOpts, (err: any) => {
      assert(err instanceof errors.ArgumentNullError)
      assert(err.message === 'Missing argument: url')
    })
  })
})
