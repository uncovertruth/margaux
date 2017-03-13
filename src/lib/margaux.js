/* @flow */
'use strict'

import { error } from './logger'

const CDP = require('chrome-remote-interface')
const errors = require('common-errors')
const u = require('url')
const _ = require('lodash')
const util = require('util')

export function create (host: 'localhost' | string, port: number, cb: (err: ?Error, client: ?CDP) => void): void {
  CDP.New({
    'host': host,
    'port': port
  }, (err, tab) => {
    if (err) {
      return cb(err)
    }
    CDP(
      { host, port, tab },
      async client => {
        const { Page, DOM, Network } = client
        try {
          await Page.enable() // Page の Event を察知するようにする
          await DOM.enable()
          await Network.enable() // これないとUAの上書きできない
        } catch (err) {
          client.close()
        } finally {
          cb(null, client)
        }
      }).on('error', err => {
        error(err)
        cb(err)
      })
  })
}

export function navigate (client: CDP, url: string, cb: () => void) {
  client.on('Page.loadEventFired', (result) => cb())
  client.Page.navigate({'url': url})
}

export function setDeviceMetricsOver (client: CDP, {width, height}: {width: number, height: number}, cb: (err: ?Error) => void) {
  client.Page.setDeviceMetricsOverride({
    width: width,
    height: height,
    deviceScaleFactor: 1,
    mobile: false,
    fitWindow: false
  }, (err, {message}) => {
    if (err) {
      return cb(new Error(message))
    }
    cb()
  })
}

export function setUserAgentOverride (client: CDP, { userAgent }: { userAgent: string }, cb: (err: ?Error) => void) {
  client.Network.setUserAgentOverride({
    userAgent: userAgent
  }, (err, {message}) => {
    if (err) {
      return cb(new Error(message))
    }
    cb()
  })
}

export function setHeaders (client: CDP, _headers: string, cb: (err: ?Error) => void) {
  client.Network.setExtraHTTPHeaders({
    headers: _headers // hash
  }, (err, {message}) => {
    if (err) {
      return cb(new Error(message))
    }
    cb()
  })
}

export function getOuterHTML (client: CDP, cb: (err: ?Error, outerHtml?: string) => void) {
  client.DOM.getDocument(null, (err, {message, root}) => {
    if (err) {
      return cb(new Error(message))
    }

    client.DOM.getOuterHTML({nodeId: root.nodeId}, (err, {message, outerHTML}) => {
      if (err) {
        return cb(new Error(message))
      }
      cb(null, outerHTML)
    })
  })
}

export function evaluate (client: CDP, expression: string, cb: (err: ?Error, res: ?{message: string}) => void) {
  // XXX: expression の validate ができないか考える
  // const expression = 'setTimeout(window.close, 3 * 1000)';
  client.Runtime.evaluate({
    'expression': expression
  }, (err, resp) => {
    if (err) {
      return cb(new Error(resp.message))
    }
    cb(null, resp)
  })
}

type CookieOptions = {
  cookieName: string,
  value: string | number,
  expires: number
}

export function getCookies (client: CDP, opts: Object, cb: (err: ?Error, res: ?{message: string}) => void) {
  client.Network.getCookies((err, resp: {message: string}) => {
    if (err) {
      return cb(new Error(resp.message))
    }
    cb(null, resp)
  })
}

export function setCookie (client: CDP, {cookieName, value, expires}: CookieOptions, cb: (err: ?Error, res: ?{message: string}) => void) {
  if (!cookieName) {
    return cb(new errors.ArgumentNullError('cookieName'))
  }
  if (!value) {
    return cb(new errors.ArgumentNullError('value'))
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

  evaluate(client, expression, (err, res: any) => {
    if (err) {
      return cb(res.message)
    }
    cb(null, res)
  })
}

export function deleteCookie (client: CDP, opts: {cookieName: string, url: string}, cb: (err: ?Error, res: ?{message: string}) => void) {
  if (!opts.cookieName) {
    return cb(new errors.ArgumentNullError('cookieName'))
  }
  if (!opts.url) {
    return cb(new errors.ArgumentNullError('url'))
  }

  client.Network.deleteCookie(opts, (err, resp) => {
    if (err) {
      return cb(new Error(resp.message))
    }
    cb(null, resp)
  })
}

export function extractViewport (client: CDP, cb: (err: ?Error, res?: string) => void) {
  // viewportのmetaタグはこの3つとcontentの中身（viewportの定義）しかattributeがないと信じている。
  const unnecessary = ['name', 'viewport', 'content']
  client.DOM.getDocument(null, (err, {root, message}) => {
    if (err) {
      return cb(new Error(message))
    }
    client.DOM.querySelectorAll({
      nodeId: root.nodeId,
      selector: 'meta'
    }, (err, {nodeIds, message}) => {
      if (err) {
        return cb(new Error(message))
      }

      Promise.all(nodeIds.map((nodeId) => {
        return new Promise((resolve, reject) => {
          client.DOM.getAttributes({
            nodeId: nodeId
          }, (err, {message, attributes}) => {
            if (err) {
              reject(new Error(message))
            }
            const ar = attributes.map((x) => x.toLowerCase())
            if (ar.indexOf('viewport') >= 0 && ar.indexOf('content') >= 0) {
              // viewportとcontentが存在するmetaタグから不要なものを除いたものがviewportの実体なはず
              const viewports = _.difference(ar, unnecessary)
              resolve(viewports.join(','))
            }
            resolve(null)
          })
        })
      })).then(results => {
        // ひと通りのmetaタグチェックが終わったら結果が配列に入ってやってくる。null以外を,でつないだ文字列にして返してしまう。
        // 間違えてviewportが2つ以上あるとおかしなことになる気がするけれど、選べない。
        // ;とかで区切った方が良いかな？（viewportのwidth=A,B,Cの区切りが,なので）
        const result = results.filter(e => e !== null).join(',')
        cb(null, result)
      }).catch(
        err => cb(new Error(err))
      )
    })
  })
}

export function forceCharset (client: CDP, callback: (err: ?Error) => void) {
  client.DOM.getDocument(null, (err, {root, message}) => {
    if (err) {
      return callback(new Error(message))
    }
    client.DOM.querySelectorAll({
      nodeId: root.nodeId,
      selector: 'meta'
    }, (err, {nodeIds, message}) => {
      if (err) {
        return callback(new Error(message))
      }

      Promise.all(nodeIds.map((nodeId) => {
        return new Promise((resolve, reject) => {
          client.DOM.getAttributes({
            nodeId: nodeId
          }, (err, {attributes, message}) => {
            if (err) {
              reject(new Error(message))
            }
            const ar = attributes.map((x) => x.toLowerCase())
            if (ar.indexOf('charset') >= 0) {
              client.DOM.setAttributeValue({
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
                client.DOM.setAttributeValue({
                  nodeId: nodeId,
                  name: 'content',
                  value: contentValue
                }, (err, {message}) => {
                  if (err) {
                    reject(new Error(message))
                  }
                  resolve()
                })
              }
            }
            resolve(null)
          })
        })
      })
      ).then(results => callback(null, results)
      ).catch(err => callback(new Error(err)))
    })
  })
}

export function close (client: CDP, cb: (err: ?Error, res: string) => void) {
  const {host, port, tab} = client
  CDP.Close({
    host: host,
    port: port,
    id: tab.id
  }, (err) => {
    if (err) {
      return error(err)
    }
    cb(null, 'foo')
  })
}

export function removeScripts (client: CDP, cb: (err: ?Error) => void) {
  client.DOM.getDocument(null, (err, {root, message}) => {
    if (err) {
      return cb(new Error(message))
    }

    // XXX: 要件達成後以下の頻出処理を上手く関数にまとめる
    client.DOM.querySelectorAll({
      nodeId: root.nodeId,
      selector: 'script'
    }, (err, {nodeIds, message}: {nodeIds: string[], message: string}) => {
      if (err) {
        return cb(new Error(message))
      }

      Promise.all(nodeIds.map(
        (nodeId) => {
          return new Promise((resolve, reject) => {
            client.DOM.removeNode({
              nodeId: nodeId
            }, (err, {message}) => {
              if (err) {
                reject(new Error(message))
              }
              resolve()
            })
          })
        })
      ).then(
        values => cb()
      ).catch(cb)
    })
  })
}

export function emptyIframes (client: CDP, cb: (err: ?Error, res: ?string[]) => void) {
  client.DOM.getDocument(null, (err, {root, message}) => {
    if (err) {
      return cb(new Error(message))
    }

    client.DOM.querySelectorAll({
      nodeId: root.nodeId,
      selector: 'iframe'
    }, (err, {nodeIds, message}) => {
      if (err) {
        return cb(new Error(message))
      }

      Promise.all(nodeIds.map(
        (nodeId) => {
          return new Promise((resolve, reject) => {
            client.DOM.setAttributeValue({
              nodeId: nodeId,
              name: 'src',
              value: ''
            }, (err, {message}) => {
              if (err) {
                reject(new Error(message))
              }
              resolve()
            })
          })
        })
      ).then(
        values => cb(null, values)
      ).catch(cb)
    })
  })
}

export function convertLinkToAbsolutely (client: CDP, {baseURI, selector}: {baseURI: string, selector: string}, cb: (err: ?Error) => void) {
  const attribute = {'img': 'src', 'link': 'href'}[selector]

  if (!attribute) {
    return cb(new errors.ArgumentNullError(selector))
  }

  client.DOM.getDocument(null, (err, {root, message}) => {
    if (err) {
      return cb(new Error(message))
    }

    client.DOM.querySelectorAll({
      nodeId: root.nodeId,
      selector: selector
    }, (err, {nodeIds, message}) => {
      if (err) {
        return cb(new Error(message))
      }

      Promise.all(nodeIds.map(nodeId => {
        return new Promise((resolve, reject) => {
          client.DOM.getAttributes({nodeId: nodeId}, (err, {attributes, message}) => {
            if (err) {
              reject(new Error(message))
            }
            const index = attributes.indexOf(attribute)
            if (index === -1) {
              resolve()
            }
            const value = attributes[index + 1]
            client.DOM.setAttributeValue({
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
      })
    ).then(() => cb()
    ).catch(err => cb(err))
    })
  })
}
