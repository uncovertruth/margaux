'use strict'

const Inliner = require('inliner')
const utils = require('./utils')

module.exports.inline = (html, opts, callback) => {
  utils.createTmpServer(html, opts, (err, server) => {
    if (err) {
      return callback(err)
    }

    new Inliner(`http://localhost:${server.address().port}`, (err, inlinedHtml) => {
      if (err) {
        return callback(err)
      }
      server.close(() => {
        process.nextTick(() => {
          callback(null, inlinedHtml)
        })
      })
    })
  })
}
