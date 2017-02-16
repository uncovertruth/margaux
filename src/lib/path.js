/* @flow */
'use strict'

import errors from 'common-errors'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'

export function isFileExists (storePath: string): boolean {
  return fs.existsSync(storePath)
}

export function generateStorePath (basePath: string, partialPath: string): string {
  return `${path.join(basePath, partialPath)}.html`
}

export function saveFile (targetPath: string, html: any, callback: any): void {
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
}

export function readFile (targetPath: string, callback: any) {
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
