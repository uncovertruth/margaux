/* @flow */
'use strict'
import express from 'express'
import logger from 'morgan'
import bodyParser from 'body-parser'
import path from 'path'

import {
  WEBSNAPSHOT_STORE_DIR as storeBaseDir,
  MOUNT_CHECK_FILE as mountCheckFile,
  MOUNT_CHECK_CONTENT as mountCheckContent,
  CHROME_CHECK_URL as chromeCheckURL
} from './const'
import Raven, { error } from './lib/logger'
import api from './api'

const app = express()

// uncomment after placing your favicon in /public
// var favicon = require('serve-favicon');
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

if (app.get('env') === 'production') {
  app.use(logger())
} else {
  app.use(logger('dev'))
}

app.use(Raven.requestHandler())

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
  const err: any = new Error('Not Found')
  err.status = 404
  next(err)
})

app.use(Raven.errorHandler())

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    const body = {
      message: err.message,
      error: err
    }
    error(err.stack || err)
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

export default app
