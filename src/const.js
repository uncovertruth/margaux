/* @flow */
'use strict'

export const CHROME_CHECK_URL: ?string = process.env.NODE_WEBSNAPHOT_CHECK_TEXT
export const CLOSE_TAB_TIMEOUT: number = parseInt(process.env.NODE_NEO_PAGE_CACHE_TAB_TIMEOUT, 10) || 30 * 1000
export const MOUNT_CHECK_CONTENT: string = 'OK'
export const MOUNT_CHECK_FILE: string = 'margaux_check.txt'
export const RAVEN_DSN: ?string = process.env.RAVEN_DSN
export const REMOTE_DEBUGGING_PORTS_START: number = 9221
export const WEBSNAPSHOT_STORE_DIR: string = process.env.NODE_WEBSNAPSHOT_STORE_DIR || '/tmp/_margaux'

const numBrowser: any = process.env.NODE_WEBSNAPSHOT_NUM_BROWSER || 4
const debuggingPorts: number[] = []
for (let i: number = 0; i < numBrowser; i++) {
  debuggingPorts.push(REMOTE_DEBUGGING_PORTS_START + i)
}

export const REMOTE_DEBUGGING_PORTSL: number[] = debuggingPorts
