'use strict'

const errors = require('common-errors')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')

module.exports = {

  'isFileExists': (storePath) => {
    return fs.existsSync(storePath)
  },

  'generateStorePath': (basePath, partialPath) => {
    return `${path.join(basePath, partialPath)}.html`
  },

  'saveFile': (targetPath, html, callback) => {
    if (!html) {
      return callback(errors.ArgumentNullError())
    }

    const saveDir = path.dirname(targetPath)
    if (!fs.existsSync(saveDir)) {
      mkdirp.sync(saveDir, {})
    }

    fs.writeFile(targetPath, html, function (err) {
      if (err) {
        return callback(err)
      }
      callback(null, targetPath)
    })
  },
  'readFile': (targetPath, callback) => {
    if (!fs.existsSync(targetPath)) {
      return callback(errors.io.FileNotFoundError(targetPath))
    }

    fs.readFile(targetPath, 'utf-8', function (err, text) {
      if (err) {
        return callback(err)
      }
      if (!text) {
        // XXX: common-errors にマッチするエラーがあれば差し替える
        return callback(new Error('EmptyFile'))
      }
      callback(null, text)
    })
  }
}
