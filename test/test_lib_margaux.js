'use strict'

const _ = require('lodash')
const assert = require('power-assert')
const co = require('co')
const promisify = require('es6-promisify')

const utils = require('../lib/utils')
const margaux = require('../lib/margaux')

const createTmpServer = promisify(utils.createTmpServer)
const create = promisify(margaux.create)
const navigate = promisify(margaux.navigate)
const deleteCookie = promisify(margaux.deleteCookie)
const setCookie = promisify(margaux.setCookie)
const getCookies = promisify(margaux.getCookies)
const getOuterHTML = promisify(margaux.getOuterHTML)

describe('lib/margaux', () => {
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
