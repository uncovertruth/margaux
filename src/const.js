'use strict'

const storeDir = process.env.NODE_WEBSNAPSHOT_STORE_DIR ||
  '/tmp/_margaux'

const tabTimeout = process.env.NODE_NEO_PAGE_CACHE_TAB_TIMEOUT ||
  30 * 1000

const numBrowser = process.env.NODE_WEBSNAPSHOT_NUM_BROWSER || 4

const REMOTE_DEBUGGING_PORTS_START = 9221

const debuggingPorts = []
for (let i = 0; i < numBrowser; i++) {
  debuggingPorts.push(REMOTE_DEBUGGING_PORTS_START + i)
}

module.exports = {
  REMOTE_DEBUGGING_PORTS: debuggingPorts,
  WEBSNAPSHOT_STORE_DIR: storeDir,
  CLOSE_TAB_TIMEOUT: tabTimeout,
  MOUNT_CHECK_FILE: 'margaux_check.txt',
  MOUNT_CHECK_CONTENT: 'OK',
  RAVEN_DNS: process.env.RAVEN_DSN,
  CHROME_CHECK_URL: process.env.NODE_WEBSNAPHOT_CHECK_TEXT
}
