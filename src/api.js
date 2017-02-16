'use strict'

const _ = require('lodash')
const errors = require('common-errors')
const path = require('path')
const validator = require('validator')
const promisify = require('es6-promisify')
const co = require('co')
const uuid = require('uuid')

const margaux = require('./lib/margaux')
const inliner = require('./lib/inliner')
const libPath = require('./lib/path')

const create = promisify(margaux.create)
const evaluate = promisify(margaux.evaluate)
const setDeviceMetricsOver = promisify(margaux.setDeviceMetricsOver)
const setUserAgentOverride = promisify(margaux.setUserAgentOverride)
const setHeaders = promisify(margaux.setHeaders)
const navigate = promisify(margaux.navigate)
const extractViewport = promisify(margaux.extractViewport)
const forceCharset = promisify(margaux.forceCharset)
const setCookie = promisify(margaux.setCookie)
const convertLinkToAbsolutely = promisify(margaux.convertLinkToAbsolutely)
const removeScripts = promisify(margaux.removeScripts)
const emptyIframes = promisify(margaux.emptyIframes)
const getOuterHTML = promisify(margaux.getOuterHTML)
const close = promisify(margaux.close)
const inline = promisify(inliner.inline)
const saveFile = promisify(libPath.saveFile)
const wait = (delay) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, delay)
  })
}

const c = require('./const')
const REMOTE_DEBUGGING_PORTS = c.REMOTE_DEBUGGING_PORTS
// console.log('REMOTE')
// console.log(REMOTE_DEBUGGING_PORTS)
const CLOSE_TAB_TIMEOUT = c.CLOSE_TAB_TIMEOUT

function Api () {}

Api.prototype.parseParameters = function (params) {
  const userAgent = params.userAgent ||
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/' +
  '537.36 (KHTML, like Gecko) Chrome/47.0.2526.73 Safari/537.36'

  return {
    referer: params.referer || '',
    width: parseInt(params.width, 10) || 1024,
    height: parseInt(params.height, 10) || 768,
    waitTime: params.waitTime || 10 * 1000,
    userAgent: userAgent,
    acceptLanguage: params.acceptLanguage || 'ja', // 'ハイフン嫌なのでラクダで'
    saveDir: params.saveDir || 'x',  // project_id を想定
    cookies: params.cookies || '' // 相手先サーバの文字エンコーディング(utf8,sjis,etc..)でURLエンコードずみのkey1=value1;key2=value2で送られてくる想定。
  }
}

Api.prototype.takeWebSnapshot = function (url, params, storeBaseDir, callback) {
  function generateKey () { return uuid.v4().replace(/-/g, '') };

  if (!validator.isURL(url)) {
    return callback(new errors.ArgumentError('url'))
  }

  const opts = this.parseParameters(params)

  let uniquePath = libPath.generateStorePath(opts.saveDir, generateKey())
  let storePath = path.join(storeBaseDir, uniquePath)

  if (libPath.isFileExists(storePath)) {
    // すでに存在していたらもう一度だけ生成する。UUIDがプロジェクトレベルで2回続けてかぶるのは困る
    uniquePath = libPath.generateStorePath(opts.saveDir, generateKey())
    storePath = path.join(storeBaseDir, uniquePath)
    if (libPath.isFileExists(storePath)) {
      return callback(errors.AlreadyInUseError(storePath))
    }
  }
  // ディレクトリトラバーサル対策。プロジェクト横断は防げない（特に問題にはならないはず）
  if (storePath.indexOf(storeBaseDir) !== 0) {
    return callback(errors.NotPermittedError(storePath))
  }

  const host = 'localhost'
  const index = _.random(0, REMOTE_DEBUGGING_PORTS.length - 1)
  const port = REMOTE_DEBUGGING_PORTS[index]
  // console.log('PORT:' + port)
  const waitTime = opts.waitTime || 1000

  co(function * () {
    // create new chrome tab
    const chrome = yield create(host, port)
    const expression = `setTimeout(window.close, ${CLOSE_TAB_TIMEOUT})`
    yield evaluate(chrome, expression)

    // set device and user angent
    yield setDeviceMetricsOver(chrome, {
      width: opts.width,
      height: opts.height
    })
    yield setUserAgentOverride(chrome, {userAgent: opts.userAgent})
    const extraHeaders = {}
    if (opts.acceptLanguage) {
      extraHeaders['Accept-Language'] = opts.acceptLanguage
    }
    if (opts.referer) {
      // https://tools.ietf.org/html/rfc2616#section-14.36 rが1つ
      extraHeaders['Referer'] = opts.referer
    }
    if (Object.keys(extraHeaders).length > 0) {
      yield setHeaders(chrome, extraHeaders)
    }

    // start rendering and wait it finish.
    yield navigate(chrome, url)
    // Cookieが渡されていたら、一度ページをロードしてからcookieをセットして、再度ページをロードする
    if (params.cookies) {
      const cookies = params.cookies.split(';').map((x) => { return x.split('=') })
      // console.log(cookies);
      cookies.forEach((cookie, idx, ar) => {
        if (cookie.length !== 2) {
          return callback(exports.ArgumentError(cookies))
        }
        // TODO yield ?
        // console.log('set cookie');
        setCookie(chrome, {
          cookieName: cookie[0],
          value: cookie[1]
        })
      })
      yield navigate(chrome, url)
    }
    yield wait(waitTime)

    const viewport = yield extractViewport(chrome)

    // resolve img@src and link@href
    yield convertLinkToAbsolutely(chrome, {baseURI: url, selector: 'img'})
    yield convertLinkToAbsolutely(chrome, {baseURI: url, selector: 'link'})

    // get html and close chrome tab
    yield removeScripts(chrome)
    yield emptyIframes(chrome)
    yield forceCharset(chrome)
    const html = yield getOuterHTML(chrome)
    yield close(chrome)

    // inlining html and save it.
    const inlinedHtml = yield inline(html, {baseUrl: url})
    yield saveFile(storePath, inlinedHtml)

    callback(null, uniquePath, viewport)
  }).catch(callback)
}

Api.prototype.ping = function (mountCheckFile, mountCheckContent,
                              chromeCheckURL, callback) {
  // mountが外れていると嫌なのでチェック
  if (!libPath.isFileExists(mountCheckFile)) {
    return callback(errors.NotFoundError(
      mountCheckFile + ' is not found.'))
  }
  libPath.readFile(mountCheckFile, (err, text) => {
    if (err) {
      err.status = 500
      return callback(errors.io.FileLoadError(err))
    }
    if (mountCheckContent.trim() !== text.trim()) {
      return callback(errors.io.FileLoadError(`get:${text} expected: ${mountCheckContent} of ${mountCheckFile}`))
    }
  })
  // chromeに接続できてるのもチェック
  const host = 'localhost'
  const index = _.random(0, REMOTE_DEBUGGING_PORTS.length - 1)
  const port = REMOTE_DEBUGGING_PORTS[index]
  const waitTime = 1000
  co(function * () {
    const chrome = yield create(host, port)
    yield navigate(chrome, chromeCheckURL)
    wait(waitTime)

    // const html = yield getOuterHTML(chrome)  // TODO remove
    yield close(chrome)
    callback()
  }).catch(callback)
}

module.exports = new Api()
