import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/wordpress/search', () => ({
    searchWordPress: vi.fn(),
}))
vi.mock('@/lib/search/index', () => ({ searchIndex: vi.fn() }))

import { searchWordPress } from '@/lib/wordpress/search'
import { searchIndex } from '@/lib/search/index'
import { GET } from './route'

function makeRequest(query: string | null) {
    const url = query === null ? 'https://example.com/api/search' : `https://example.com/api/search?q=${encodeURIComponent(query)}`
    return new NextRequest(url)
}

describe('GET /api/search', () => {
    beforeEach(() => {
        vi.mocked(searchWordPress).mockReset()
        vi.mocked(searchIndex).mockReset().mockResolvedValue(null)
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

    it('resposta do índice não passa pelo WordPress nem pelo limite (digitar rápido não gera 429)', async () => {
        vi.mocked(searchIndex).mockResolvedValue([{ id: 1, title: 'BTS', href: '/groups/bts', type: 'group' }])
        for (let i = 0; i < 60; i++) expect((await GET(makeRequest('bts'))).status).toBe(200)
        expect(searchWordPress).not.toHaveBeenCalled()
    })

    it('a busca REST (índice frio) continua limitada por IP', async () => {
        vi.mocked(searchWordPress).mockResolvedValue([])
        const req = () => new NextRequest('https://example.com/api/search?q=bts', { headers: { 'x-forwarded-for': '203.0.113.9' } })
        const statuses: number[] = []
        for (let i = 0; i < 40; i++) statuses.push((await GET(req())).status)
        expect(statuses.slice(0, 30).every(s => s === 200)).toBe(true)
        expect(statuses.slice(30).every(s => s === 429)).toBe(true)
    })
})
