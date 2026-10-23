export declare const VERSION: string

export declare class CheckHostError extends Error {
  status: number
  type: string
  /** Seconds to wait, set on 429. */
  retryAfter?: number
}

export type CheckType = 'ping' | 'http' | 'traceroute' | 'dns'

export interface MeasurementRequest {
  type: CheckType
  target: string
  /** Number of measurement servers, 1-25. */
  limit?: number
  locations?: { country?: string; magic?: string }[]
  measurementOptions?: Record<string, unknown>
}

export interface ProbeResult {
  probe: { continent: string; country: string; city: string; asn: number; network: string; [k: string]: unknown }
  result: {
    status: 'finished' | 'failed' | 'offline' | 'in-progress'
    rawOutput: string
    stats?: { min: number; avg: number; max: number; loss: number }
    statusCode?: number
    timings?: Record<string, number>
    hops?: unknown[]
    answers?: unknown[]
    [k: string]: unknown
  }
}

export interface Measurement {
  id: string
  type: CheckType
  status: 'in-progress' | 'finished'
  target: string
  /** Permanent link: https://check-host.one/r/{resultSlug} */
  resultSlug?: string
  results: ProbeResult[]
}

export interface RunOptions {
  limit?: number
  /** Free-form: country code, city, continent, ASN or network name. */
  locations?: string[]
  /** Max time to poll, in ms. Default 60000. */
  wait?: number
}

export declare class CheckHost {
  constructor(opts?: { baseUrl?: string; fetch?: typeof fetch })
  createMeasurement(request: MeasurementRequest): Promise<{ id: string; probesCount: number }>
  getMeasurement(id: string): Promise<Measurement>
  getResult(slug: string): Promise<Measurement>
  hostInfo(target?: string): Promise<Record<string, unknown>>
  probes(): Promise<{ location: Record<string, unknown> }[]>
  stats(): Promise<{ total: number; today: number; week: number }>
  run(type: CheckType, target: string, opts?: RunOptions & { options?: Record<string, unknown> }): Promise<Measurement>
  ping(target: string, opts?: RunOptions & { packets?: number }): Promise<Measurement>
  tcpPing(target: string, opts?: RunOptions & { port?: number }): Promise<Measurement>
  http(target: string, opts?: RunOptions & { method?: 'HEAD' | 'GET' | 'OPTIONS'; path?: string; protocol?: 'HTTP' | 'HTTPS' | 'HTTP2' }): Promise<Measurement>
  traceroute(target: string, opts?: RunOptions & { protocol?: 'ICMP' | 'UDP' | 'TCP' }): Promise<Measurement>
  dns(target: string, opts?: RunOptions & { record?: string; resolver?: string }): Promise<Measurement>
}

export default CheckHost
