/* @flow */
import { describe, it } from 'mocha'
import { random } from 'faker'
import assert from 'assert'

describe('lib/margaux', () => {
  const host = 'localhost'
  const port = 9223
  const margaux = require('../../src/lib/margaux')

  it('close', done => {
    margaux.create(host, port, (err, client) => {
      assert(err === null)
      margaux.close(client, (err, res) => {
        assert(err === null)
        assert(res)
        done()
      })
    })
  })

  it('setDeviceMetricsOver', done => {
    margaux.create(host, port, (err, client) => {
      assert(!err)
      margaux.setDeviceMetricsOver(
        client,
        {
          height: random.number(),
          width: random.number()
        },
        () => {
          done()
        }
      )
    })
  })

  it('setUserAgentOverride', done => {
    const UA = require('../../src/const').USER_AGENT
    margaux.create(host, port, (err, client) => {
      assert(!err)
      margaux.setUserAgentOverride(client, { userAgent: UA }, () => {
        done()
      })
    })
  })

  it('setHeaders', done => {
    margaux.create(host, port, (err, client) => {
      assert(!err)
      margaux.setHeaders(client, random.alphaNumeric(), () => {
        done()
      })
    })
  })

  it('removeScripts', done => {
    margaux.create(host, port, (err, client) => {
      assert(!err)
      margaux.removeScripts(client, err => {
        assert(!err)
        done()
      })
    })
  })

  it('emptyIframes', done => {
    margaux.create(host, port, (err, client) => {
      assert(!err)
      margaux.emptyIframes(client, (err, res) => {
        assert(!err)
        done()
      })
    })
  })

  it('evaluate', done => {
    assert(typeof margaux.evaluate === 'function')

    margaux.create(host, port, (err, client: any) => {
      assert(!err)
      client._ws.on('close', result => {
        // 本来は1000の正常終了だったが、いつのバージョンからかChromeがwindow.closeだと異常終了を返すようになった。
        // closeのテストではなく、evaluateのテストなので異常終了を正とする。
        // 正常系では影響がないが、延々終わらない異常系でこの方式を使ってchromeを閉じているので問題がないわけではない。
        assert(result === 1006, '異常終了')
      })

      const expression = 'setTimeout(window.close,  5)'
      margaux.evaluate(client, expression, (err, result) => {
        assert(!err)
        assert(result)
        done()
      })
    })
  })
})
