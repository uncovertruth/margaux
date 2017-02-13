'use strict'

const _ = require('lodash')
const http = require('http')
const portastic = require('portastic')
const spawn = require('child_process').spawn
const os = require('os')
const promisify = require('es6-promisify')
const co = require('co')

const libUtils = {

  'emptyPorts': function (callback) {
    portastic.find({
      min: 10000,
      max: 11000
    }).then(ports => callback(null, _.sampleSize(ports, 5)))
  },

  'getGoogleChromeBin': function () {
    if (os.platform() === 'darwin') {
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    }
    return 'google-chrome'
  },

  'runChromeBrowsers': function (ports, callback) {
    if (ports.length === 0) {
      ports = [9222, 9223, 9224, 9225]
    }
    Promise.all(ports.forEach((port) => {
      return new Promise((resolve, reject) => {
        libUtils.runChromeWithRemoteDebuggingPort(port, (err, result) => {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      })
    })).then((results) => {
      callback(null, results)
    }).catch((err) => {
      callback(err)
    })
  },

  'runChromeWithRemoteDebuggingPort': function (remoteDebuggingPort, callback) {
    const args = [
      '--remote-debugging-port=' + remoteDebuggingPort,
      '--no-default-browser-check',
      '--no-first-run',
      '--disable-default-apps',
      '--user-data-dir=' + os.tmpdir() + '/test.chrome' + remoteDebuggingPort
    ]

    const chromeApp = spawn(this.getGoogleChromeBin(), args)
    // chromeApp.stdout.on('data', function (data) {
    //   console.log('Received data: ' + data);
    // });
    // chromeApp.stderr.on('data', function (data) {
    //   console.log('Received data: ' + data);
    // });

    return callback(null, chromeApp)
  },

  'listenOneAnyPorts': function (server, ports, callback) {
    // for promisify
    const _listen = (server, port, callback) => {
      server
        .on('error', callback)
        .on('listening', callback)
        .listen(port)
    }

    co(function * () {
      // 指定された ports で listen が成功するまで繰り返す
      for (const port of ports) {
        try {
          yield promisify(_listen)(server, port)
          return callback(null, port)
        } catch (e) {
          // アドレスが既に使用されている場合は想定内なので処理を継続
          if (e.code === 'EADDRINUSE') {
            continue
          }
          return callback(e)
        }
      }
      // 指定された ports すべてが利用できなかった場合はエラー
      callback(new Error('all ports are used'))
    })
  },

  'createTmpServer': function (html, opts, callback) {
    libUtils.emptyPorts(function (err, ports) {
      if (err) {
        return callback(err)
      }

      const acceptLanguage = opts.acceptLanguage || 'ja'

      const server = http.createServer(function (req, res) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Accept-Language': acceptLanguage
        })
        res.end(req.url === '/' ? html : '')
      })

      libUtils.listenOneAnyPorts(server, ports, function (err, port) {
        if (err) {
          return callback(err)
        }
        callback(null, server)
      })
    })
  }
}

module.exports = libUtils
