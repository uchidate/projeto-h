import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from './route'
import { reiniciarMetricas } from '@/lib/metrics/registry'
import { limparEstado } from '@/lib/metrics/collectors'

const TOKEN = 'token-de-teste-com-tamanho-realista-0123456789'

function req(auth?: string): Request {
    return new Request('https://exemplo.test/api/metrics', {
        headers: auth ? { authorization: auth } : {},
    })
}

describe('GET /api/metrics', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => {
        reiniciarMetricas()
        limparEstado()
        vi.stubEnv('METRICS_TOKEN', TOKEN)
        fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            headers: new Headers({ 'X-WP-Total': '5' }),
            json: async () => [],
        } as unknown as Response)
        vi.stubGlobal('fetch', fetchMock)
    })
    afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

    it('responde 401 sem cabecalho de autorizacao', async () => {
        const r = await GET(req())
        expect(r.status).toBe(401)
        expect(r.headers.get('WWW-Authenticate')).toBe('Bearer')
    })

    it('responde 401 com token errado', async () => {
        const r = await GET(req('Bearer token-errado'))
        expect(r.status).toBe(401)
    })

    it('responde 401 com token de mesmo tamanho porem diferente', async () => {
        const errado = 'X'.repeat(TOKEN.length)
        const r = await GET(req(`Bearer ${errado}`))
        expect(r.status).toBe(401)
    })

    it('responde 401 quando o esquema nao e Bearer', async () => {
        const r = await GET(req(`Basic ${TOKEN}`))
        expect(r.status).toBe(401)
    })

    it('responde 503 quando METRICS_TOKEN nao esta configurado — falha fechado', async () => {
        vi.stubEnv('METRICS_TOKEN', '')
        const r = await GET(req(`Bearer ${TOKEN}`))
        expect(r.status).toBe(503)
    })

    it('responde 200 no formato de exposicao com o token correto', async () => {
        const r = await GET(req(`Bearer ${TOKEN}`))
        expect(r.status).toBe(200)
        expect(r.headers.get('Content-Type')).toContain('text/plain')
        const corpo = await r.text()
        expect(corpo).toContain('portal_build_info')
        expect(corpo).toContain('portal_cms_up')
        expect(corpo).toContain('nodejs_eventloop_lag_seconds')
    })

    it('nunca permite cache da resposta', async () => {
        const r = await GET(req(`Bearer ${TOKEN}`))
        expect(r.headers.get('Cache-Control')).toContain('no-store')
    })

    it('ainda responde 200 quando o WordPress esta fora', async () => {
        fetchMock.mockRejectedValue(new Error('down'))
        const r = await GET(req(`Bearer ${TOKEN}`))
        expect(r.status).toBe(200)
        expect(await r.text()).toContain('portal_cms_up 0')
    })
})
