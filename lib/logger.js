/* @flow */

const raven = require('raven')

const c = require('../const')
raven.config(c.RAVEN_DSN).install()

module.exports = raven
