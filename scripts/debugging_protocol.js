'use strict'

// SEE ALSO: https://developer.chrome.com/devtools/docs/protocol/1.1/index

const margaux = require('../lib/margaux')

margaux.list('localhost', 9222, (err, chromes) => {
  console.error(err, chromes.length)
})

margaux.create('localhost', 9222, (err, chrome) => {
  console.error(err)
  margaux.getHtmlAttribute(chrome, 'data-created', (err, value) => {
    console.error(err)
    setTimeout(() => {
      // margaux.close(chrome, () => {} );
    }, 5000)
  })
})
