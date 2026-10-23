// Live smoke test: node example.js
import assert from 'node:assert'
import { CheckHost } from './index.js'

const ch = new CheckHost()
const m = await ch.http('example.com', { limit: 2, locations: ['Europe'] })
assert.equal(m.status, 'finished')
for (const { probe, result } of m.results) console.log(`${probe.city}, ${probe.country}: HTTP ${result.statusCode}`)
console.log(`https://check-host.one/r/${m.resultSlug}`)
assert.equal((await ch.hostInfo('1.1.1.1')).asn, 13335)
