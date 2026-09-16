import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authOptions, authorizeCredentials, trocarGooglePorSessaoWp } from './auth'

function getAuthorize() {
    return authorizeCredentials
}

describe('authOptions — authorize (login)', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('retorna null quando username está ausente', async () => {
        const authorize = getAuthorize()
        expect(await authorize({ password: 'senha123' })).toBeNull()
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('retorna null quando password está ausente', async () => {
        const authorize = getAuthorize()
        expect(await authorize({ username: 'user@example.com' })).toBeNull()
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('retorna null quando nenhuma credencial é passada', async () => {
        const authorize = getAuthorize()
        expect(await authorize(undefined)).toBeNull()
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('retorna o usuário mapeado quando o WP responde ok com token', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                userId: 42, name: 'Jimin Fan', email: 'fan@example.com', avatar: 'https://x.com/a.jpg',
                token: 'jwt-token-abc', bio: 'Fã de K-pop', roles: ['subscriber'],
            }),
        })
        const authorize = getAuthorize()
        const result = await authorize({ username: 'fan@example.com', password: 'senha123' })
        expect(result).toEqual({
            id: '42', name: 'Jimin Fan', email: 'fan@example.com', image: 'https://x.com/a.jpg',
            token: 'jwt-token-abc', bio: 'Fã de K-pop', roles: ['subscriber'],
        })
    })

    it('usa bio="" e roles=[] como default quando o WP não retorna esses campos', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ userId: 1, name: 'X', email: 'x@x.com', avatar: null, token: 'tok' }),
        })
        const authorize = getAuthorize()
        const result = await authorize({ username: 'x@x.com', password: 'senha' }) as { bio: string; roles: string[] }
        expect(result.bio).toBe('')
        expect(result.roles).toEqual([])
    })

    it('retorna null quando o WP responde erro HTTP (credenciais inválidas)', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 401 })
        const authorize = getAuthorize()
        expect(await authorize({ username: 'x@x.com', password: 'errada' })).toBeNull()
    })

    it('retorna null quando o WP responde ok mas sem token no corpo', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ userId: 1 }) })
        const authorize = getAuthorize()
        expect(await authorize({ username: 'x@x.com', password: 'senha' })).toBeNull()
    })

    it('retorna null (não lança) quando o fetch rejeita', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        const authorize = getAuthorize()
        expect(await authorize({ username: 'x@x.com', password: 'senha' })).toBeNull()
    })
})

describe('authorize — repasse do IP para o throttle do WP', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ token: 't', userId: 1, name: 'n', email: 'e@e.com' }),
        })
        vi.stubGlobal('fetch', fetchMock)
    })
    afterEach(() => vi.unstubAllGlobals())

    it('envia só o primeiro salto do x-forwarded-for', async () => {
        await authorizeCredentials(
            { username: 'u@u.com', password: 'senha123' },
            { headers: { 'x-forwarded-for': '203.0.113.7, 172.16.0.1' } },
        )
        const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
        expect(headers['X-Forwarded-For']).toBe('203.0.113.7')
    })

    it('omite o header quando não há IP — não inventa origem', async () => {
        await authorizeCredentials({ username: 'u@u.com', password: 'senha123' })
        const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
        expect(headers['X-Forwarded-For']).toBeUndefined()
    })
})

describe('authOptions — callbacks jwt/session (propagação de dados customizados)', () => {
    it('jwt() copia id/token/bio/roles/picture do user pro token no primeiro login', async () => {
        const token = { sub: 'x' } as Record<string, unknown>
        const user = { id: '1', token: 'jwt-abc', bio: 'oi', roles: ['subscriber'], image: 'https://x.com/a.jpg' }
        const result = await authOptions.callbacks!.jwt!({ token, user } as never)
        expect(result).toMatchObject({ id: '1', token: 'jwt-abc', bio: 'oi', roles: ['subscriber'], picture: 'https://x.com/a.jpg' })
    })

    it('jwt() mantém o token como está em chamadas subsequentes (sem "user", ex: refresh de sessão)', async () => {
        const token = { id: '1', token: 'jwt-abc', bio: 'oi', roles: ['subscriber'], picture: 'old.jpg' }
        const result = await authOptions.callbacks!.jwt!({ token } as never)
        expect(result).toEqual(token)
    })

    it('session() copia id/bio/roles do token pra session.user', async () => {
        const session = { user: {} } as unknown as { user: { id: string; bio: string; roles: string[] } }
        const token = { id: '1', token: 'jwt-abc', bio: 'oi', roles: ['subscriber'] }
        const result = await authOptions.callbacks!.session!({ session, token } as never) as unknown as typeof session
        expect(result.user).toMatchObject({ id: '1', bio: 'oi', roles: ['subscriber'] })
    })

    // O ponto da mudança: /api/auth/session entrega este objeto ao browser.
    // Enquanto a credencial do WP vinha junto, qualquer XSS virava takeover.
    it('session() NÃO expõe o token do WP ao cliente', async () => {
        const session = { user: {} } as unknown as { user: Record<string, unknown> }
        const token = { id: '1', token: 'jwt-abc', bio: 'oi', roles: ['subscriber'] }
        const result = await authOptions.callbacks!.session!({ session, token } as never) as unknown as typeof session
        expect(result.user.token).toBeUndefined()
    })
})


describe('trocarGooglePorSessaoWp — Google vira sessão do WordPress', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })
    afterEach(() => { vi.unstubAllGlobals() })

    it('devolve os dados do WP quando a troca dá certo', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ token: 'tok', userId: 7, name: 'Ana', email: 'a@b.c' }),
        })
        const r = await trocarGooglePorSessaoWp('id-token')
        expect(r).toMatchObject({ token: 'tok', userId: 7 })

        // O id_token vai no CORPO para o WP verificar. Se este contrato mudar
        // sem o outro lado mudar junto, o login social passa a falhar calado.
        const [url, init] = fetchMock.mock.calls[0]
        expect(String(url)).toContain('/oc/v1/auth/google')
        expect(JSON.parse(init.body)).toEqual({ id_token: 'id-token' })
    })

    it('retorna null quando o WP recusa o token', async () => {
        fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) })
        expect(await trocarGooglePorSessaoWp('falso')).toBeNull()
    })

    // Sem token do WP não há acesso a lista, conquista nem perfil: deixar a
    // sessão nascer assim seria entregar um login que não abre nada.
    it('retorna null quando o WP responde ok mas sem token', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ userId: 7 }) })
        expect(await trocarGooglePorSessaoWp('id-token')).toBeNull()
    })

    it('retorna null (não lança) quando a rede falha', async () => {
        fetchMock.mockRejectedValue(new Error('rede'))
        expect(await trocarGooglePorSessaoWp('id-token')).toBeNull()
    })
})

describe('authOptions — sessão', () => {
    it('mantém o maxAge casado com oc_session_ttl() do WordPress (30 dias)', () => {
        // Se um lado mudar sozinho, o usuário fica "logado" com token morto:
        // a sessão parece válida e toda chamada autenticada falha.
        expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60)
    })
})
