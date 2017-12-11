/* @flow */
'use strict'
import express from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import path from 'path'

import {
  WEBSNAPSHOT_STORE_DIR as storeBaseDir,
  MOUNT_CHECK_FILE as mountCheckFile,
  MOUNT_CHECK_CONTENT as mountCheckContent,
  CHROME_CHECK_URL as chromeCheckURL
} from './const'
import Raven, { warning } from './lib/logger'
import api from './api'

const app = express()

// uncomment after placing your favicon in /public
// var favicon = require('serve-favicon');
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(morgan('combined'))

app.use(Raven.requestHandler())

app.use(bodyParser.urlencoded({ extended: true }))

app.use(function (req: $Request, res, next) {
  res.contentType('application/json')
  next()
})

app.post('/', (req: express$Request, res, next) => {
  const url = req.body.url
  const opts = api.parseParameters(req.body)

  api.takeWebSnapshot(
    url,
    opts,
    storeBaseDir,
    (err: any, snapshotUrl, viewport) => {
      if (err) {
        err.status = 500
        return next(err)
      }
      res.send({ url: snapshotUrl, viewport, originalUrl: url })
    }
  )
})

app.get('/ping', (req: express$Request, res, next) => {
  const storePath = path.join(storeBaseDir, mountCheckFile)
  api.ping(storePath, mountCheckContent, chromeCheckURL, err => {
    if (err) {
      err.status = 500
      return next(err)
    }
    res.send({ result: mountCheckContent })
  })
})

// catch 404 and forward to error handler
app.use((req: express$Request, res, next) => {
  const err: any = new Error('Not Found')
  err.status = 404
  warning(err)
  next(err)
})

app.use(Raven.errorHandler())

app.use((err, req: express$Request, res, next) => {
  res.status(err.status || 500)
  res.send({
    message: err.message,
    error: {}
  })
  res.end(res.sentry + '\n')
  next()
})

export default app
