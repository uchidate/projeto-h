// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchResultsPage } from './SearchResultsPage'
import * as analytics from '@/lib/analytics'
import type { SearchResult } from '@/lib/search/types'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: () => <div data-testid="ad-slot" /> }))

function result(overrides: Partial<SearchResult> = {}): SearchResult {
    return { id: 1, type: 'production', title: 'Resultado Teste', href: '/productions/x', thumbnail: undefined, ...overrides }
}

describe('SearchResultsPage', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        pushMock.mockClear()
        vi.restoreAllMocks()
    })

    it('mostra o empty state de "digite pelo menos 2 caracteres" sem query', () => {
        render(<SearchResultsPage query="" results={[]} />)
        expect(screen.getByText(/digite pelo menos 2 caracteres/i)).toBeInTheDocument()
    })

    it('mostra "nenhum resultado" quando há query mas 0 resultados', () => {
        render(<SearchResultsPage query="xyz" results={[]} />)
        expect(screen.getByText(/nenhum resultado/i)).toBeInTheDocument()
    })

    it('mostra a contagem de resultados no singular', () => {
        render(<SearchResultsPage query="bts" results={[result()]} />)
        expect(screen.getByText(/1 resultado para/i)).toBeInTheDocument()
    })

    it('mostra a contagem de resultados no plural', () => {
        render(<SearchResultsPage query="bts" results={[result(), result({ id: 2 })]} />)
        expect(screen.getByText(/2 resultados para/i)).toBeInTheDocument()
    })

    it('agrupa resultados em seções por tipo', () => {
        render(<SearchResultsPage query="x" results={[
            result({ type: 'production', title: 'Prod' }),
            result({ id: 2, type: 'artist', title: 'Art' }),
        ]} />)
        expect(screen.getByText('Produções')).toBeInTheDocument()
        expect(screen.getByText('Artistas')).toBeInTheDocument()
    })

    it('não mostra seção de tipo sem resultados', () => {
        render(<SearchResultsPage query="x" results={[result({ type: 'production' })]} />)
        expect(screen.queryByText('Artistas')).not.toBeInTheDocument()
    })

    it('rastreia a busca via analytics quando a query tem 2+ caracteres', () => {
        const spy = vi.spyOn(analytics, 'trackSearch').mockImplementation(() => {})
        render(<SearchResultsPage query="bts" results={[result()]} />)
        expect(spy).toHaveBeenCalledWith('bts', 1)
    })

    it('não rastreia quando a query tem menos de 2 caracteres', () => {
        const spy = vi.spyOn(analytics, 'trackSearch').mockImplementation(() => {})
        render(<SearchResultsPage query="b" results={[]} />)
        expect(spy).not.toHaveBeenCalled()
    })

    it('digitar no input navega (debounced) para /search?q=', async () => {
        vi.useRealTimers()
        const user = userEvent.setup()
        render(<SearchResultsPage query="" results={[]} />)
        await user.type(screen.getByPlaceholderText(/buscar artistas/i), 'x')
        await new Promise(r => setTimeout(r, 400))
        expect(pushMock).toHaveBeenCalledWith('/search?q=x')
    }, 10000)

    it('clicar em limpar busca navega para /search sem query', async () => {
        vi.useRealTimers()
        const user = userEvent.setup()
        render(<SearchResultsPage query="bts" results={[]} />)
        await user.click(screen.getByRole('button', { name: /limpar busca/i }))
        await new Promise(r => setTimeout(r, 400))
        expect(pushMock).toHaveBeenCalledWith('/search')
    }, 10000)

    it('não mostra o botão de limpar quando o campo está vazio', () => {
        render(<SearchResultsPage query="" results={[]} />)
        expect(screen.queryByRole('button', { name: /limpar busca/i })).not.toBeInTheDocument()
    })
})
