import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getGuias } from './guias'

function guia(slug: string) {
    return { slug, kind: 'productions', filter: {} }
}

describe('getGuias', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna os guias quando a API responde com um array', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [guia('a'), guia('b')] })
        expect(await getGuias()).toEqual([guia('a'), guia('b')])
    })

    it('retorna array vazio quando a API responde com algo que não é array', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ error: 'not found' }) })
        expect(await getGuias()).toEqual([])
    })

    it('descarta item sem slug', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [guia('a'), { title: 'sem slug' }] })
        expect(await getGuias()).toEqual([guia('a')])
    })

    it('retorna array vazio quando o fetch falha (erro tratado)', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await getGuias()).toEqual([])
    })
})
