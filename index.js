// JavaScript client for the check-host.one API: ping, TCP ping, HTTP,
// traceroute and DNS checks from servers in 100+ countries. No API key needed.

export const VERSION = '1.0.0'

export class CheckHostError extends Error {
  constructor(status, type, message, retryAfter) {
    super(`${status} ${type}: ${message}`)
    this.name = 'CheckHostError'
    this.status = status
    this.type = type
    this.retryAfter = retryAfter
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

export class CheckHost {
  constructor({ baseUrl = 'https://check-host.one', fetch: f = globalThis.fetch } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.fetch = f
  }

  async #request(method, path, body) {
    const res = await this.fetch(this.baseUrl + path, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': `check-host-js/${VERSION}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const retry = Number(res.headers.get('Retry-After'))
      throw new CheckHostError(res.status, data.error?.type ?? 'http_error', data.error?.message ?? res.statusText, retry || undefined)
    }
    return data
  }

  createMeasurement(request) { return this.#request('POST', '/api/v1/measurements', request) }
  getMeasurement(id) { return this.#request('GET', `/api/v1/measurements/${encodeURIComponent(id)}`) }
  getResult(slug) { return this.#request('GET', `/api/v1/results/${encodeURIComponent(slug)}`) }
  hostInfo(target) { return this.#request('GET', '/api/v1/hostinfo' + (target ? `?target=${encodeURIComponent(target)}` : '')) }
  probes() { return this.#request('GET', '/api/v1/probes') }
  stats() { return this.#request('GET', '/api/v1/stats') }

  /** Start a check and poll until it finishes. */
  async run(type, target, { limit, locations, options, wait = 60_000 } = {}) {
    const req = { type, target }
    if (limit) req.limit = limit
    if (locations?.length) req.locations = locations.map(magic => ({ magic }))
    if (options) req.measurementOptions = options
    const { id } = await this.createMeasurement(req)
    const deadline = Date.now() + wait
    for (;;) {
      const m = await this.getMeasurement(id)
      if (m.status !== 'in-progress' || Date.now() > deadline) return m
      await sleep(1000)
    }
  }

  ping(target, { packets = 3, ...o } = {}) { return this.run('ping', target, { ...o, options: { packets } }) }
  tcpPing(target, { port = 443, ...o } = {}) { return this.run('ping', target, { ...o, options: { protocol: 'TCP', port } }) }
  http(target, { method = 'HEAD', path = '/', protocol = 'HTTPS', ...o } = {}) {
    return this.run('http', target, { ...o, options: { protocol, request: { method, path } } })
  }
  traceroute(target, { protocol = 'ICMP', ...o } = {}) { return this.run('traceroute', target, { ...o, options: { protocol } }) }
  dns(target, { record = 'A', resolver, ...o } = {}) {
    return this.run('dns', target, { ...o, options: { query: { type: record }, ...(resolver && { resolver }) } })
  }
}

export default CheckHost
