/* global __ENV, __ITER */
import http from 'k6/http'
import { check, sleep } from 'k6'

const baseUrl = (__ENV.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const productionHost = Boolean(__ENV.PRODUCTION_HOST) && baseUrl.includes(__ENV.PRODUCTION_HOST)

if (productionHost && __ENV.ALLOW_PRODUCTION_LOAD !== '1') {
  throw new Error('Defina ALLOW_PRODUCTION_LOAD=1 para executar carga em produção.')
}

export const options = {
  vus: 3,
  duration: '15s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
  },
}

const paths = ['/', '/api/health', '/blog', '/productions']

export default function siteSmokeIteration() {
  const path = paths[__ITER % paths.length]
  const response = http.get(`${baseUrl}${path}`, { tags: { path } })
  check(response, { 'status saudável': (res) => res.status >= 200 && res.status < 400 })
  sleep(1)
}
