/* @flow */
'use strict'

import _ from 'lodash'
import errors from 'common-errors'
import path from 'path'
import validator from 'validator'
import { promisify } from 'util'
import uuid from 'uuid'

import * as margaux from './lib/margaux'
import inliner from './lib/inliner'
import * as libPath from './lib/path'
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  DEFAULT_WAIT_TIME,
  USER_AGENT,
  REMOTE_DEBUGGING_PORTS,
  CLOSE_TAB_TIMEOUT
} from './const'

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
const inline = promisify(inliner)
const saveFile = promisify(libPath.saveFile)
const wait = delay => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, delay)
  })
}

function Api () {}

Api.prototype.parseParameters = function (params) {
  return {
    referer: params.referer || '',
    width: parseInt(params.width, 10) || DEFAULT_WIDTH,
    height: parseInt(params.height, 10) || DEFAULT_HEIGHT,
    waitTime: params.waitTime || DEFAULT_WAIT_TIME,
    userAgent: params.userAgent || USER_AGENT,
    acceptLanguage: params.acceptLanguage || 'ja', // 'ハイフン嫌なのでラクダで'
    saveDir: params.saveDir || 'x', // project_id を想定
    cookies: params.cookies || '' // 相手先サーバの文字エンコーディング(utf8,sjis,etc..)でURLエンコードずみのkey1=value1;key2=value2で送られてくる想定。
  }
}

type TakeWebSnapshotOptions = {
  saveDir?: string,
  cookies?: string
}

Api.prototype.takeWebSnapshot = function (
  url: string,
  params: TakeWebSnapshotOptions,
  storeBaseDir: string,
  cb: (err: ?Error, url?: string, viewport?: string) => void
) {
  function generateKey () {
    return uuid.v4().replace(/-/g, '')
  }

  if (!validator.isURL(url, { require_tld: false })) {
    return cb(new errors.ArgumentError('url'))
  }

  const opts = this.parseParameters(params)

  let uniquePath = libPath.generateStorePath(opts.saveDir, generateKey())
  let storePath = path.join(storeBaseDir, uniquePath)

  if (libPath.isFileExists(storePath)) {
    // すでに存在していたらもう一度だけ生成する。UUIDがプロジェクトレベルで2回続けてかぶるのは困る
    uniquePath = libPath.generateStorePath(opts.saveDir, generateKey())
    storePath = path.join(storeBaseDir, uniquePath)
    if (libPath.isFileExists(storePath)) {
      return cb(errors.AlreadyInUseError(storePath))
    }
  }
  // ディレクトリトラバーサル対策。プロジェクト横断は防げない（特に問題にはならないはず）
  if (storePath.indexOf(storeBaseDir) !== 0) {
    return cb(errors.NotPermittedError(storePath))
  }

  const host = 'localhost'
  const index = _.random(0, REMOTE_DEBUGGING_PORTS.length - 1)
  const port = REMOTE_DEBUGGING_PORTS[index]
  const waitTime = opts.waitTime || 1000
  ;(async function () {
    // create new chrome tab
    const chrome = await create(host, port)
    const expression = `setTimeout(window.close, ${CLOSE_TAB_TIMEOUT})`
    await evaluate(chrome, expression)

    // set device and user angent
    await setDeviceMetricsOver(chrome, {
      width: opts.width,
      height: opts.height
    })
    await setUserAgentOverride(chrome, { userAgent: opts.userAgent })
    const extraHeaders = {}
    if (opts.acceptLanguage) {
      extraHeaders['Accept-Language'] = opts.acceptLanguage
    }
    if (opts.referer) {
      // https://tools.ietf.org/html/rfc2616#section-14.36 rが1つ
      extraHeaders['Referer'] = opts.referer
    }
    if (Object.keys(extraHeaders).length > 0) {
      await setHeaders(chrome, extraHeaders)
    }

    // start rendering and wait it finish.
    await navigate(chrome, url)
    // Cookieが渡されていたら、一度ページをロードしてからcookieをセットして、再度ページをロードする
    if (params.cookies) {
      const cookies = params.cookies.split(';').map(x => {
        return x.split('=')
      })
      cookies.forEach((cookie, idx, ar) => {
        if (cookie.length !== 2) {
          return cb(exports.ArgumentError(cookies))
        }
        // TODO yield ?
        // console.log('set cookie');
        setCookie(chrome, {
          cookieName: cookie[0],
          value: cookie[1]
        })
      })
      await navigate(chrome, url)
    }
    await wait(waitTime)

    const viewport = await extractViewport(chrome)

    // resolve img@src and link@href
    await convertLinkToAbsolutely(chrome, { baseURI: url, selector: 'img' })
    await convertLinkToAbsolutely(chrome, { baseURI: url, selector: 'link' })

    // get html and close chrome tab
    await removeScripts(chrome)
    await emptyIframes(chrome)
    await forceCharset(chrome)
    const html = await getOuterHTML(chrome)
    await close(chrome)

    // inlining html and save it.
    const inlinedHtml = await inline(html, { baseUrl: url })
    await saveFile(storePath, inlinedHtml)

    cb(null, uniquePath, viewport)
  })()
}

Api.prototype.ping = function (
  mountCheckFile,
  mountCheckContent,
  chromeCheckURL,
  callback
) {
  // mountが外れていると嫌なのでチェック
  if (!libPath.isFileExists(mountCheckFile)) {
    return callback(errors.NotFoundError(mountCheckFile + ' is not found.'))
  }
  libPath.readFile(mountCheckFile, (err, text) => {
    if (err) {
      err.status = 500
      return callback(errors.io.FileLoadError(err))
    }
    if (mountCheckContent.trim() !== text.trim()) {
      return callback(
        errors.io.FileLoadError(
          `get:${text} expected: ${mountCheckContent} of ${mountCheckFile}`
        )
      )
    }
  })

  // chromeに接続できてるのもチェック
  const host = 'localhost'
  const index = _.random(0, REMOTE_DEBUGGING_PORTS.length - 1)
  const port = REMOTE_DEBUGGING_PORTS[index]
  ;(async function () {
    const chrome = await create(host, port)
    await navigate(chrome, chromeCheckURL)
    await wait(1000)

    await getOuterHTML(chrome)
    await close(chrome)
    callback()
  })()
}

export default new Api()
