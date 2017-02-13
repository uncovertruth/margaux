#!/usr/bin/env node
'use strict'

const moment = require('moment')
const program = require('commander')
const api = require('./api')

program
  .option('-h, --host <n>', 'threshold time.')
  .option('-p, --port <n>', 'threshold time.', parseInt)
  .option('-t, --thresholdTime <n>', 'threshold time.', parseInt)
  .parse(process.argv)

const host = program.host
const port = program.port
const thresholdTime = program.thresholdTime || 10 * 1000

const limitTime = moment().unix() - thresholdTime

api.watchChrome(host, port, limitTime, function (err, result) {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(result)
})
