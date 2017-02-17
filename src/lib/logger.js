/* @flow */

import Raven from 'raven'
const c = require('../const')

Raven.config(c.RAVEN_DSN).install()
export default Raven

type CustomError = string | Error
type RavenOptions = {
  level: 'warning' | 'error',
  extra: ?Object
}

function capture (err: CustomError, options: ?RavenOptions): void {
  if (typeof err === 'string') {
    Raven.captureMessage(err, options)
    return
  }
  Raven.captureException(err, options)
}

export function error (err: CustomError, extra: ?Object): void {
  capture(err, {level: 'error', extra})
}
export function warning (err: CustomError, extra: ?Object): void {
  capture(err, {level: 'warning', extra})
}
