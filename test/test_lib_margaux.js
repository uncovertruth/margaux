/* @flow */
import { describe, it } from 'mocha'
import _ from 'lodash'
import assert from 'assert'
import co from 'co'
import promisify from 'es6-promisify'
import errors from 'common-errors'

describe('lib/margaux', () => {
  const utils = require('../lib/utils')
  const margaux = require('../lib/margaux')

  const createTmpServer = promisify(utils.createTmpServer)
  const create = promisify(margaux.create)
  const navigate = promisify(margaux.navigate)
  const deleteCookie = promisify(margaux.deleteCookie)
  const setCookie = promisify(margaux.setCookie)
  const getCookies = promisify(margaux.getCookies)
  const getOuterHTML = promisify(margaux.getOuterHTML)
  const emptyIframes = promisify(margaux.emptyIframes)

  it('evaluate', function (done) {
    margaux.create('localhost', 9223, (err, chrome) => {
      assert(err === null)
      chrome.ws.on('close', (result) => {
        // 本来は1000の正常終了だったが、いつのバージョンからかChromeがwindow.closeだと異常終了を返すようになった。
        // closeのテストではなく、evaluateのテストなので異常終了を正とする。
        // 正常系では影響がないが、延々終わらない異常系でこの方式を使ってchromeを閉じているので問題がないわけではない。
        assert.ok(result === 1006, '異常終了')
        done()
      })

      const expression = 'setTimeout(window.close,  5)'
      margaux.evaluate(chrome, expression, (err, result) => {
        assert.ok(err === null)
      })
    })
  })

  it('should not create without host and port', function (done) {
    margaux.create('', 0, (err) => {
      assert(err)
      done()
    })
  })

  it('should not remove scripts without HTML tags', function (done) {
    const chrome = createTmpServer('', {})
    chrome.then((server) => {
      margaux.removeScripts(server)
    }).catch((err) => {
      assert(err)
      done()
    })
  })

  it('should work emptyIframes with iframe tag', function (done) {
    const html = '<html><head></head><body><iframe></iframe></body></html>'
    const chrome = createTmpServer(html, {})
    chrome.then((server) => {
      emptyIframes(server)
    }).then((res) => {
      done(res)
    })
  })

  it('should not set cookie without cookie name', function () {
    const chrome = createTmpServer('', {})
    const cookieOpts = {
      cookieName: '',
      value: 12345
    }
    margaux.setCookie(chrome, cookieOpts, (err) => {
      assert(err instanceof errors.ArgumentNullError)
      assert(err.message === 'Missing argument: cookieName')
    })
  })

  it('should not set cookie without value name', function () {
    const chrome = createTmpServer('', {})
    const cookieOpts = {
      cookieName: 'test',
      value: ''
    }
    margaux.setCookie(chrome, cookieOpts, (err) => {
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
    margaux.deleteCookie(chrome, cookieOpts, (err) => {
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
    margaux.deleteCookie(chrome, cookieOpts, (err) => {
      assert(err instanceof errors.ArgumentNullError)
      assert(err.message === 'Missing argument: url')
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
})
