import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getUserFavorites, toggleFavorite, setContentState, registerUser } from './userApi'

describe('wpUser (via getUserFavorites)', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('envia o token no header X-OC-Token', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [1, 2] })
        await getUserFavorites('meu-token')
        const [, opts] = fetchMock.mock.calls[0]
        expect(opts.headers['X-OC-Token']).toBe('meu-token')
    })

    it('lança erro quando a resposta não é ok', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })
        await expect(getUserFavorites('token-invalido')).rejects.toThrow('401')
    })

    it('usa cache: no-store em toda requisição', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        await getUserFavorites('token')
        const [, opts] = fetchMock.mock.calls[0]
        expect(opts.cache).toBe('no-store')
    })
})

describe('toggleFavorite', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('faz POST com o production_id no body', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ action: 'added', total: 1 }) })
        await toggleFavorite('token', 42)
        const [, opts] = fetchMock.mock.calls[0]
        expect(opts.method).toBe('POST')
        expect(JSON.parse(opts.body)).toEqual({ production_id: 42 })
    })
})

describe('setContentState', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('monta o body com o state quando definindo um estado', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
        await setContentState('token', 'production', 1, 'favorite')
        const [, opts] = fetchMock.mock.calls[0]
        expect(JSON.parse(opts.body)).toEqual({ object_type: 'production', object_id: 1, state: 'favorite' })
    })

    it('monta o body com remove_state quando removendo (state vazio)', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
        await setContentState('token', 'production', 1, '', 'favorite')
        const [, opts] = fetchMock.mock.calls[0]
        expect(JSON.parse(opts.body)).toEqual({ object_type: 'production', object_id: 1, state: '', remove_state: 'favorite' })
    })
})

describe('registerUser', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna os dados do usuário criado quando bem-sucedido', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ token: 't', userId: 1, name: 'X', email: 'x@x.com', avatar: '' }) })
        const result = await registerUser({ name: 'X', email: 'x@x.com', password: '123456' })
        expect(result.userId).toBe(1)
    })

    it('lança erro com a mensagem da API quando falha', async () => {
        fetchMock.mockResolvedValue({ ok: false, json: async () => ({ message: 'E-mail já cadastrado' }) })
        await expect(registerUser({ name: 'X', email: 'x@x.com', password: '123' })).rejects.toThrow('E-mail já cadastrado')
    })

    it('usa mensagem de erro genérica quando a API não retorna message', async () => {
        fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) })
        await expect(registerUser({ name: 'X', email: 'x@x.com', password: '123' })).rejects.toThrow('Erro ao criar conta')
    })
})
