import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const getWpTokenMock = vi.fn()
vi.mock('@/lib/auth/wpToken', () => ({ getWpToken: () => getWpTokenMock() }))

const { GET, POST } = await import('./route')

function request(path: string, init: RequestInit = {}) {
    return new NextRequest(`http://localhost/api/user/${path}`, init as never)
}
const ctx = (path: string[]) => ({ params: Promise.resolve({ path }) })

describe('proxy /api/user/*', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        getWpTokenMock.mockReset().mockResolvedValue('token-do-jwt')
        fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ ok: true }), { status: 200 }),
        )
        vi.stubGlobal('fetch', fetchMock)
    })

    // O ponto do proxy: a credencial entra aqui, no servidor, e nunca sai daqui.
    it('carimba o X-OC-Token vindo do JWT', async () => {
        await GET(request('user/favorites'), ctx(['user', 'favorites']))
        const [, init] = fetchMock.mock.calls[0]
        expect((init.headers as Record<string, string>)['X-OC-Token']).toBe('token-do-jwt')
    })

    it('responde 401 sem sessão, sem chamar o WordPress', async () => {
        getWpTokenMock.mockResolvedValue(null)
        const res = await GET(request('user/favorites'), ctx(['user', 'favorites']))
        expect(res.status).toBe(401)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    // Sem allowlist o proxy viraria acesso autenticado a toda a REST do WP.
    it('recusa caminho fora da área de usuário', async () => {
        const res = await GET(request('auth/login'), ctx(['auth', 'login']))
        expect(res.status).toBe(404)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('preserva a query string', async () => {
        const req = new NextRequest('http://localhost/api/user/user/production-status?production_id=7')
        await GET(req, ctx(['user', 'production-status']))
        expect(fetchMock.mock.calls[0][0]).toContain('?production_id=7')
    })

    it('encaminha corpo e método em escrita', async () => {
        await POST(
            request('user/content-state', { method: 'POST', body: JSON.stringify({ state: 'favorite' }) }),
            ctx(['user', 'content-state']),
        )
        const [, init] = fetchMock.mock.calls[0]
        expect(init.method).toBe('POST')
        expect(init.body).toBe(JSON.stringify({ state: 'favorite' }))
    })

    it('propaga o status de erro do WordPress', async () => {
        fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'x' }), { status: 403 }))
        const res = await GET(request('user/favorites'), ctx(['user', 'favorites']))
        expect(res.status).toBe(403)
    })

    it('devolve 502 quando o WordPress está inacessível', async () => {
        fetchMock.mockRejectedValue(new Error('timeout'))
        const res = await GET(request('user/favorites'), ctx(['user', 'favorites']))
        expect(res.status).toBe(502)
    })
})
