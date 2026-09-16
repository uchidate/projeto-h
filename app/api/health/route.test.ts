import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

describe('GET /api/health', () => {
    beforeEach(() => {
        vi.unstubAllGlobals()
        vi.unstubAllEnvs()
    })

    // Staging é um ambiente só e cada push o sobrescreve: sem isto, nada dizia
    // qual versão estava no ar (confusão real em 2026-09-12).
    it('informa o commit em execução, curto', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => Response.json({ namespaces: ['wp/v2'] })))
        vi.stubEnv('GIT_COMMIT_SHA', '0c99185f03921031d104bdfcf22eb4f5a8c24a0d')
        expect((await (await GET()).json()).commit).toBe('0c99185')
        vi.stubEnv('GIT_COMMIT_SHA', '')
        expect((await (await GET()).json()).commit).toBe('desconhecido')
    })

    // Regressão: até 2026-07-04, esse endpoint sempre respondia {ok:true} sem
    // checar nada — o WP ficou 500 (Redis fora do ar) sem o health check do
    // deploy jamais detectar. Corrigido pra checar o WP de verdade.
    it('retorna 200 e ok:true quando o WP responde normalmente', async () => {
        const fetchMock = vi.fn(async () => Response.json({ namespaces: ['wp/v2'] }))
        vi.stubGlobal('fetch', fetchMock)
        const res = await GET()
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json).toEqual({ ok: true, wordpress: 'up', latencyMs: expect.any(Number), commit: expect.any(String) })
        expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')
        expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            cache: 'no-store',
            headers: { Accept: 'application/json' },
            signal: expect.any(AbortSignal),
        }))
    })

    it('retorna 503 quando o WP responde com erro (ex: 500)', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('erro', { status: 500 })))
        const res = await GET()
        expect(res.status).toBe(503)
        const json = await res.json()
        expect(json).toEqual({
            ok: false,
            wordpress: 'down',
            latencyMs: expect.any(Number),
            commit: expect.any(String),
            reason: 'http-error',
        })
    })

    it('retorna 503 quando recebe HTTP 200 que não é a raiz válida da REST API', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>proxy</html>', { status: 200 })))
        const res = await GET()
        expect(res.status).toBe(503)
        expect(await res.json()).toEqual({
            ok: false,
            wordpress: 'down',
            latencyMs: expect.any(Number),
            commit: expect.any(String),
            reason: 'invalid-response',
        })
    })

    it('retorna 503 quando o JSON 200 não contém o contrato do WordPress', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true })))
        const res = await GET()
        expect(res.status).toBe(503)
        expect((await res.json()).reason).toBe('invalid-response')
    })

    it('retorna 503 quando o fetch falha/lança (WP inacessível)', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network error') }))
        const res = await GET()
        expect(res.status).toBe(503)
    })

    it('retorna 503 quando o fetch estoura o timeout', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => {
            const err = new DOMException('The operation was aborted', 'AbortError')
            throw err
        }))
        const res = await GET()
        expect(res.status).toBe(503)
    })
})
