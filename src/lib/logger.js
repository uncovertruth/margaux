/* @flow */

import Raven from 'raven'
const c = require('../const')

Raven.config(c.RAVEN_DSN).install()
export default Raven
