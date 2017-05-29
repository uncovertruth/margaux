/* @flow */
'use strict'

import Inliner from 'inliner'
import {createTmpServer} from './utils'

export default function (html: any, opts: any, callback: any) {
  createTmpServer(html, opts, (err, server) => {
    if (err) {
      return callback(err)
    }

    new Inliner(
      `http://localhost:${server.address().port}`,
      (err, inlinedHtml) => {
        if (err) {
          return callback(err)
        }
        server.close(() => {
          process.nextTick(() => {
            callback(null, inlinedHtml)
          })
        })
      }
    )
  })
}
