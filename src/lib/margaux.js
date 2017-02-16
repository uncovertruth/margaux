/* @flow */
'use strict'

const Chrome = require('chrome-remote-interface')
const errors = require('common-errors')
const u = require('url')
const _ = require('lodash')
const util = require('util')

type Callback = any // TODO
type Options = any // TODO

export function create (host: string, port: number, callback: Callback) {
  Chrome.New({
    'host': host,
    'port': port
  }, (err, tab) => {
    if (err) {
      return callback(err)
    }
    Chrome({
      'host': host,
      'port': port,
      'chooseTab': tab
    }).then(chrome => {
      chrome.Page.enable() // Page の Event を察知するようにする
      chrome.DOM.enable()
      chrome.Network.enable() // これないとUAの上書きできない
      callback(null, chrome)
    }).catch(err => {
      callback(err)
    })
  })
}

export function navigate (chrome: Chrome, url: string, callback: Callback) {
  chrome.on('Page.loadEventFired', (result) => {
    callback()
  })
  chrome.Page.navigate({'url': url})
}

export function close (chrome: Chrome, callback: Callback) {
  Chrome.Close({
    host: chrome.host,
    port: chrome.port,
    id: chrome.chooseTab.id
  }, (err) => {
    // クライアント側の websocket を終了
    chrome.close()
    callback(err)
  })
}

export function setDeviceMetricsOver (chrome: Chrome, opts: Options, callback: Callback) {
  const width = opts.width || 1024
  const height = opts.height || 768

  chrome.Page.setDeviceMetricsOverride({
    width: width,
    height: height,
    deviceScaleFactor: 1,
    mobile: false,
    fitWindow: false
  }, function (err, resp) {
    if (err) {
      return callback(new Error(resp.message))
    }
    callback()
  })
}

export function setUserAgentOverride (chrome: Chrome, opts: Options, callback: Callback) {
  const userAgent = opts.userAgent ||
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/' +
    '537.36 (KHTML, like Gecko) Chrome/47.0.2526.73 Safari/537.36'

  chrome.Network.setUserAgentOverride({
    userAgent: userAgent
  }, (err, resp) => {
    if (err) {
      return callback(new Error(resp.message))
    }
    callback()
  })
}

export function setHeaders (chrome: Chrome, _headers: string, callback: Callback) {
  chrome.Network.setExtraHTTPHeaders({
    headers: _headers // hash
  }, (err, resp) => {
    if (err) {
      return callback(new Error(resp.message))
    }
    callback()
  })
}

export function getOuterHTML (chrome: Chrome, callback: Callback) {
  chrome.DOM.getDocument(null, (err, resp) => {
    if (err) {
      return callback(new Error(resp.message))
    }

    chrome.DOM.getOuterHTML({nodeId: resp.root.nodeId}, (err, resp) => {
      if (err) {
        return callback(new Error(resp.message))
      }
      callback(null, resp.outerHTML)
    })
  })
}

export function removeScripts (chrome: Chrome, callback: Callback) {
  chrome.DOM.getDocument(null, (err, resp) => {
    if (err) {
      return callback(new Error(resp.message))
    }

    // XXX: 要件達成後以下の頻出処理を上手く関数にまとめる
    chrome.DOM.querySelectorAll({
      nodeId: resp.root.nodeId,
      selector: 'script'
    }, (err, resp) => {
      if (err) {
        return callback(new Error(resp.message))
      }

      Promise.all(resp.nodeIds.map((nodeId) => {
        return new Promise((resolve, reject) => {
          chrome.DOM.removeNode({
            nodeId: nodeId
          }, (err, resp) => {
            if (err) {
              reject(new Error(resp.message))
            }
            resolve()
          })
        })
      })).then((result) => callback()).catch(callback)
    })
  })
}

export function emptyIframes (chrome: Chrome, callback: Callback) {
  chrome.DOM.getDocument(null, (err, resp) => {
    if (err) {
      return callback(new Error(resp.message))
    }

    chrome.DOM.querySelectorAll({
      nodeId: resp.root.nodeId,
      selector: 'iframe'
    }, (err, resp) => {
      if (err) {
        return callback(new Error(resp.message))
      }

      Promise.all(resp.nodeIds.map((nodeId) => {
        return new Promise((resolve, reject) => {
          chrome.DOM.setAttributeValue({
            nodeId: nodeId,
            name: 'src',
            value: ''
          }, (err, resp) => {
            if (err) {
              reject(new Error(resp.message))
            }
            resolve()
          })
        })
      })).then((result) => callback()).catch(callback)
    })
  })
}

export function evaluate (chrome: Chrome, expression: any, callback: Callback) {
  // XXX: expression の validate ができないか考える
  // const expression = 'setTimeout(window.close, 3 * 1000)';
  chrome.Runtime.evaluate({
    'expression': expression
  }, (err, resp) => {
    if (err) {
      return callback(new Error(resp.message))
    }
    callback(null, resp)
  })
}

export function convertLinkToAbsolutely (chrome: Chrome, opts: Options, callback: Callback) {
  const baseURI = opts.baseURI
  const selector = opts.selector
  const attribute = {'img': 'src', 'link': 'href'}[selector]

  if (!attribute) {
    return callback(new errors.ArgumentNullError(selector))
  }

  chrome.DOM.getDocument(null, (err, resp) => {
    if (err) {
      return callback(new Error(resp.message))
    }

    chrome.DOM.querySelectorAll({
      nodeId: resp.root.nodeId,
      selector: selector
    }, (err, resp) => {
      if (err) {
        return callback(new Error(resp.message))
      }

      Promise.all(resp.nodeIds.map(function (nodeId) {
        return new Promise(function (resolve, reject) {
          chrome.DOM.getAttributes({nodeId: nodeId}, function (err, resp) {
            if (err) {
              reject(new Error(resp.message))
            }
            const index = resp.attributes.indexOf(attribute)
            if (index === -1) {
              resolve()
            }
            const value = resp.attributes[index + 1]
            chrome.DOM.setAttributeValue({
              nodeId: nodeId,
              name: attribute,
              value: u.resolve(baseURI, value)
            }, function (err, resp) {
              if (err) {
                reject(new Error(resp))
              }
              resolve()
            })
          })
        })
      })).then(function () {
        callback()
      }).catch(function (err) {
        callback(err)
      })
    })
  })
}

export function getCookies (chrome: Chrome, opts: Options, callback: Callback) {
  chrome.Network.getCookies((err, resp) => {
    if (err) {
      return callback(new Error(resp.message))
    }
    callback(null, resp)
  })
}

export function setCookie (chrome: Chrome, opts: Options, callback: Callback) {
  const cookieName = opts.cookieName
  const value = opts.value
  const expires = opts.expires || 10 * 1000

  if (!cookieName) {
    return callback(new errors.ArgumentNullError('cookieName'))
  }
  if (!value) {
    return callback(new errors.ArgumentNullError('value'))
  }

  const formattedExpires = new Date(
    new Date().getTime() + expires
  ).toUTCString()

  const expression = util.format(
    'window.document.cookie = "%s=%s; expires=%s"',
    cookieName,
    value,
    formattedExpires
  )

  chrome.Runtime.evaluate({'expression': expression}, (err, resp) => {
    if (err) {
      return callback(resp.message)
    }
    callback(null, resp)
  })
}

export function deleteCookie (chrome: Chrome, opts: Options, callback: Callback) {
  if (!opts.cookieName) {
    return callback(new errors.ArgumentNullError('cookieName'))
  }
  if (!opts.url) {
    return callback(new errors.ArgumentNullError('url'))
  }

  chrome.Network.deleteCookie(opts, (err, resp) => {
    if (err) {
      return callback(new Error(resp.message))
    }
    callback(null, resp)
  })
}

export function extractViewport (chrome: Chrome, callback: Callback) {
  // viewportのmetaタグはこの3つとcontentの中身（viewportの定義）しかattributeがないと信じている。
  const unnecessary = ['name', 'viewport', 'content']
  chrome.DOM.getDocument(null, (err, resp) => {
    if (err) {
      return callback(new Error(resp.message))
    }
    chrome.DOM.querySelectorAll({
      nodeId: resp.root.nodeId,
      selector: 'meta'
    }, (err, resp) => {
      if (err) {
        return callback(new Error(resp.message))
      }

      Promise.all(resp.nodeIds.map((nodeId) => {
        return new Promise((resolve, reject) => {
          chrome.DOM.getAttributes({
            nodeId: nodeId
          }, (err, resp) => {
            if (err) {
              reject(new Error(resp.message))
            }
            const ar = resp['attributes'].map((x) => { return x.toLowerCase() })
            if (ar.indexOf('viewport') >= 0 && ar.indexOf('content') >= 0) {
              // viewportとcontentが存在するmetaタグから不要なものを除いたものがviewportの実体なはず
              const viewports = _.difference(ar, unnecessary)
              resolve(viewports.join(','))
            }
            // マッチするものがなかった場合はnull返す
            resolve(null)
          })
        })
      })).then(function (results) {
        // ひと通りのmetaタグチェックが終わったら結果が配列に入ってやってくる。null以外を,でつないだ文字列にして返してしまう。
        // 間違えてviewportが2つ以上あるとおかしなことになる気がするけれど、選べない。
        // ;とかで区切った方が良いかな？（viewportのwidth=A,B,Cの区切りが,なので）
        const result = results.filter(
          function (e) { return e !== null }).join(',')
        callback(null, result)
      }).catch(function (err) {
        return callback(new Error(err))
      })
    })
  })
}

export function forceCharset (chrome: Chrome, callback: Callback) {
  chrome.DOM.getDocument(null, (err, resp) => {
    if (err) {
      return callback(new Error(resp.message))
    }
    chrome.DOM.querySelectorAll({
      nodeId: resp.root.nodeId,
      selector: 'meta'
    }, (err, resp) => {
      if (err) {
        return callback(new Error(resp.message))
      }

      Promise.all(resp.nodeIds.map((nodeId) => {
        return new Promise((resolve, reject) => {
          chrome.DOM.getAttributes({
            nodeId: nodeId
          }, (err, resp) => {
            if (err) {
              reject(new Error(resp.message))
            }
            const ar = resp['attributes'].map((x) => { return x.toLowerCase() })
            if (ar.indexOf('charset') >= 0) {
              chrome.DOM.setAttributeValue({
                nodeId: nodeId,
                name: 'charset',
                value: 'UTF-8'
              }, (err, resp) => {
                if (err) {
                  reject(new Error(resp.message))
                }
                resolve()
              })
            } else if (ar.indexOf('content') >= 0 && ar.indexOf('http-equiv') >= 0) {
              if (ar[ar.indexOf('http-equiv') + 1].toLowerCase() === 'content-type') {
                let contentValue = ar[ar.indexOf('content') + 1]
                contentValue = contentValue.replace(/charset=([-_a-z0-9 ]+)/g, 'charset=UTF-8')
                contentValue = contentValue.replace(/charset=['"]([-_a-z0-9 ]+)['"]"/g, 'charset="UTF-8"')
                chrome.DOM.setAttributeValue({
                  nodeId: nodeId,
                  name: 'content',
                  value: contentValue
                }, (err, resp) => {
                  if (err) {
                    reject(new Error(resp.message))
                  }
                  resolve()
                })
              }
            }
            resolve(null)
          })
        })
      })).then(function (results) {
        callback(null, results)
      }).catch(function (err) {
        return callback(new Error(err))
      })
    })
  })
}
