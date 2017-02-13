#!/usr/bin/env node
'use strict'
const program = require('commander')
const api = require('./api')

program
  .option('-w, --width <n>', 'screen.width', parseInt)
  .option('-h, --height <n>', 'screen.width', parseInt)
  .option('-t, --waitTime <n>', 'waiting time for rendering.', parseInt)
  .option('-u, --userAgent <n>', 'accpet language')
  .option('-l, --acceptLanguage <n>', 'accpet language')
  .parse(process.argv)

const url = program.args[0]
const opts = api.parseParameters(program)

// 15秒経過したら強制終了
setTimeout(function () {
  throw new Error('timeout')
}, 15 * 1000)

api.takeWebSnapshot(url, opts, function (err, html, viewport) {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(html)
  process.exit()
})
