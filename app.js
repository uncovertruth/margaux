'use strict'

const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const path = require('path')
const raven = require('raven')

const api = require('./api')
const app = express()

const c = require('./const')
const storeBaseDir = c.WEBSNAPSHOT_STORE_DIR

// uncomment after placing your favicon in /public
// var favicon = require('serve-favicon');
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

if (app.get('env') === 'production') {
  app.use(logger())
} else {
  app.use(logger('dev'))
}

app.use(raven.middleware.express.requestHandler(c.RAVEN_DSN))

app.use(bodyParser.urlencoded({ extended: true }))

app.use(function (req, res, next) {
  res.contentType('application/json')
  next()
})

app.post('/', (req, res, next) => {
  const url = req.body.url
  const opts = api.parseParameters(req.body)

  api.takeWebSnapshot(url, opts, storeBaseDir, (err, url, viewport) => {
    if (err) {
      err.status = 500
      return next(err)
    }
    res.send({url: url, viewport: viewport})
  })
})

app.get('/ping', (req, res, next) => {
  const mountCheckFile = c.MOUNT_CHECK_FILE
  const mountCheckContent = c.MOUNT_CHECK_CONTENT
  const chromeCheckURL = c.CHROME_CHECK_URL
  const storePath = path.join(storeBaseDir, mountCheckFile)
  api.ping(storePath, mountCheckContent, chromeCheckURL, (err) => {
    if (err) {
      err.status = 500
      return next(err)
    }
    res.send({result: mountCheckContent})
  })
})

if (app.get('env') === 'development') {
  app.get('/s3/:dir/:hash', (req, res, next) => {
    const dir = req.params.dir
    const hash = req.params.hash
    const storeDir = require('./const').WEBSNAPSHOT_STORE_DIR
    const file = require('path').join(storeDir, dir, hash)
    require('./lib/path').readFile(file, (err, text) => {
      if (err) {
        err.status = 500
        next(err)
      }
      res.contentType('text/html')
      res.send(text)
    })
  })
}

// catch 404 and forward to error handler
// これより前に dispatch を記述しないと 404 になるので注意
app.use(function (req, res, next) {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

app.use(raven.middleware.express.errorHandler(c.RAVEN_DSN))

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    const body = {
      message: err.message,
      error: err
    }
    console.error(err.stack || err)
    res.send(body)
    next()
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.send({
    message: err.message,
    error: {}
  })
  res.end(res.sentry + '\n')
  next()
})

module.exports = app
