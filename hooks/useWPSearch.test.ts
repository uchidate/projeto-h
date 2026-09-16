// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWPSearch } from './useWPSearch'

describe('useWPSearch', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('não busca (fica com results vazio) quando a query tem menos de 2 caracteres', async () => {
        const { result } = renderHook(() => useWPSearch('a'))
        await new Promise(r => setTimeout(r, 250))
        expect(result.current.results).toEqual([])
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('busca depois do debounce e retorna os resultados', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ results: [{ id: 1, title: 'BTS', href: '/groups/bts', type: 'group' }] }) })
        const { result } = renderHook(() => useWPSearch('bts'))

        await waitFor(() => expect(result.current.results).toHaveLength(1), { timeout: 1000 })
        expect(result.current.results[0]).toMatchObject({ id: 1, title: 'BTS' })
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/search?q=bts'), expect.anything())
    })

    it('isLoading fica true durante a busca e false depois', async () => {
        let resolveJson!: () => void
        fetchMock.mockImplementation(() => new Promise(resolve => {
            resolveJson = () => resolve({ ok: true, json: async () => ({ results: [] }) })
        }))
        const { result } = renderHook(() => useWPSearch('bts'))

        await waitFor(() => expect(result.current.isLoading).toBe(true), { timeout: 1000 })
        resolveJson()
        await waitFor(() => expect(result.current.isLoading).toBe(false))
    })

    it('resultado fica vazio quando a API responde erro HTTP', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500 })
        const { result } = renderHook(() => useWPSearch('bts'))
        await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 1000 })
        expect(result.current.results).toEqual([])
    })

    it('ignora resultado de uma busca desatualizada (query mudou antes da resposta anterior chegar)', async () => {
        let callCount = 0
        fetchMock.mockImplementation(async (url: string) => {
            callCount++
            if (url.includes('q=old')) {
                await new Promise(r => setTimeout(r, 100)) // resposta lenta da busca antiga
                return { ok: true, json: async () => ({ results: [{ id: 1, title: 'OLD', href: '/x', type: 'post' }] }) }
            }
            return { ok: true, json: async () => ({ results: [{ id: 2, title: 'NEW', href: '/y', type: 'post' }] }) }
        })

        const { result, rerender } = renderHook(({ q }) => useWPSearch(q), { initialProps: { q: 'old' } })
        await new Promise(r => setTimeout(r, 200)) // deixa o debounce da 1ª busca dispará-la
        rerender({ q: 'new query' })

        await waitFor(() => expect(result.current.results.some(r => r.title === 'NEW')).toBe(true), { timeout: 1000 })
        // a resposta lenta da busca "old" não deve sobrescrever o resultado da busca mais nova
        await new Promise(r => setTimeout(r, 150))
        expect(result.current.results.every(r => r.title !== 'OLD')).toBe(true)
        expect(callCount).toBeGreaterThanOrEqual(2)
    })
})
