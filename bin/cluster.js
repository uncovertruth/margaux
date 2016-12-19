'use strict'

const _ = require('lodash')
const cluster = require('cluster')
const app = require('./../app')
const numCPUs = require('os').cpus().length
const port = 8080

if (cluster.isMaster) {
  console.log('parents')
  _.range(numCPUs).forEach((num) => {
    cluster.fork()
  })
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`)
    cluster.fork()
  })
} else {
  console.log('worker')
  app.listen(port)
}
