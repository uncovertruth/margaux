/* @flow */
'use strict'

import _ from 'lodash'
import http from 'http'
import portastic from 'portastic'
import {spawn} from 'child_process'
import os from 'os'
import promisify from 'es6-promisify'
import co from 'co'

import {error, warning} from './logger'
import {REMOTE_DEBUGGING_PORTS} from '../const'

export function getGoogleChromeBin (): string {
  if (os.platform() === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  }
  return 'google-chrome'
}

export function emptyPorts (callback: any) {
  portastic
    .find({
      min: 10000,
      max: 11000
    })
    .then(ports => callback(null, _.sampleSize(ports, 5)))
}

function listenOneAnyPorts (server, ports, callback) {
  // for promisify
  const _listen = (server, port, callback) => {
    server.on('error', callback).on('listening', callback).listen(port)
  }

  co(function * () {
    // 指定された ports で listen が成功するまで繰り返す
    for (const port of ports) {
      try {
        yield promisify(_listen)(server, port)
        return callback(null, port)
      } catch (err) {
        // アドレスが既に使用されている場合は想定内なので処理を継続
        if (err.code === 'EADDRINUSE') {
          warning(`duplicated ports`, {port})
          continue
        }
        return callback(err)
      }
    }
    // 指定された ports すべてが利用できなかった場合はエラー
    callback(new Error('all ports are used'))
  })
}

export function runChromeWithRemoteDebuggingPort (
  remoteDebuggingPort: number,
  callback: any
) {
  const args = [
    '--remote-debugging-port=' + remoteDebuggingPort,
    '--no-default-browser-check',
    '--no-first-run',
    '--disable-default-apps',
    '--user-data-dir=' + os.tmpdir() + '/test.chrome' + remoteDebuggingPort
  ]

  return callback(null, spawn(getGoogleChromeBin(), args))
}

export function runChromeBrowsers (
  ports: number[] = REMOTE_DEBUGGING_PORTS,
  cb: (err: ?Error, res: any) => void = (err, res) => {
    if (err) {
      error(err)
    }
  }
) {
  const queue = []
  ports.forEach((port: number) => {
    queue.push(
      new Promise((resolve, reject) => {
        runChromeWithRemoteDebuggingPort(port, (err, result) => {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      })
    )
  })
  Promise.all(queue)
    .then(results => {
      cb(null, results)
    })
    .catch(err => {
      cb(err)
    })
}

export function createTmpServer (
  html: string,
  opts: {acceptLanguage?: string},
  cb: (err: ?Error, server: any) => void
) {
  emptyPorts((err, ports) => {
    if (err) {
      return cb(err)
    }

    const acceptLanguage = opts.acceptLanguage || 'ja'

    const server = http.createServer((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Accept-Language': acceptLanguage
      })
      res.end(req.url === '/' ? html : '')
    })

    listenOneAnyPorts(server, ports, (err: null | Error, port: void) => {
      if (err) {
        return cb(err)
      }
      cb(null, server)
    })
  })
}
