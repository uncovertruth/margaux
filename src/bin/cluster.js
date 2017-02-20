'use strict'

import _ from 'lodash'
import cluster from 'cluster'
import os from 'os'

import app from '../app'
import { warning } from '../lib/logger'

const numCPUs = os.cpus().length
const port = 8080

if (cluster.isMaster) {
  _.range(numCPUs).forEach((num) => {
    cluster.fork()
  })
  cluster.on('exit', (worker, code, signal) => {
    warning(`worker ${worker.process.pid} died`)
    cluster.fork()
  })
} else {
  app.listen(port)
}
