import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/wordpress/search', () => ({
    searchWordPress: vi.fn(),
}))

import { searchWordPress } from '@/lib/wordpress/search'
import { GET } from './route'

function makeRequest(query: string | null) {
    const url = query === null ? 'https://example.com/api/search' : `https://example.com/api/search?q=${encodeURIComponent(query)}`
    return new NextRequest(url)
}

describe('GET /api/search', () => {
    beforeEach(() => {
        vi.mocked(searchWordPress).mockReset()
    })

    it('retorna results:[] sem chamar searchWordPress quando não há query', async () => {
        const res = await GET(makeRequest(null))
        expect(await res.json()).toEqual({ results: [] })
        expect(searchWordPress).not.toHaveBeenCalled()
    })

    it('retorna results:[] sem chamar searchWordPress quando a query tem menos de 2 caracteres', async () => {
        const res = await GET(makeRequest('a'))
        expect(await res.json()).toEqual({ results: [] })
        expect(searchWordPress).not.toHaveBeenCalled()
    })

    it('chama searchWordPress com a query trimada e limite 12', async () => {
        vi.mocked(searchWordPress).mockResolvedValue([])
        await GET(makeRequest('  bts  '))
        expect(searchWordPress).toHaveBeenCalledWith('bts', 12)
    })

    it('retorna os resultados de searchWordPress no formato esperado', async () => {
        const mockResults = [{ id: 1, title: 'BTS', href: '/groups/bts', type: 'group' as const, thumbnail: undefined }]
        vi.mocked(searchWordPress).mockResolvedValue(mockResults)
        const res = await GET(makeRequest('bts'))
        expect(await res.json()).toEqual({ results: mockResults })
    })

    it('define Cache-Control como private (nunca compartilhado — resultado pode variar por usuário)', async () => {
        vi.mocked(searchWordPress).mockResolvedValue([])
        const res = await GET(makeRequest('bts'))
        expect(res.headers.get('Cache-Control')).toBe('private, max-age=30')
    })
})
