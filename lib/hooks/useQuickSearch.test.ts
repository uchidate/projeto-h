import { describe, it, expect } from 'vitest'
import { useQuickSearch } from './useQuickSearch'

describe('useQuickSearch', () => {
    it('começa fechado', () => {
        expect(useQuickSearch.getState().isOpen).toBe(false)
    })

    it('open() abre o quick search', () => {
        useQuickSearch.getState().open()
        expect(useQuickSearch.getState().isOpen).toBe(true)
    })

    it('close() fecha o quick search', () => {
        useQuickSearch.getState().open()
        useQuickSearch.getState().close()
        expect(useQuickSearch.getState().isOpen).toBe(false)
    })

    it('é um store compartilhado (mesma instância em qualquer import)', () => {
        useQuickSearch.getState().open()
        expect(useQuickSearch.getState().isOpen).toBe(true)
        useQuickSearch.setState({ isOpen: false })
        expect(useQuickSearch.getState().isOpen).toBe(false)
    })
})
