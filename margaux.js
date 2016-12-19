#!/usr/bin/env node
'use strict'

const p = require('./package.json')

require('commander')
  .version(p.version)
  .command('decanting [url]', 'get rendered html after dom processed.')
  .parse(process.argv)
