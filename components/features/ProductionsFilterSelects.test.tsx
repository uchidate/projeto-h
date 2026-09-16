// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductionsFilterSelects } from './ProductionsFilterSelects'
import type { WPTerm } from '@/lib/wordpress/types'

const pushMock = vi.fn()
let searchParamsValue = ''

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, replace: vi.fn() }),
    usePathname: () => '/productions',
    useSearchParams: () => new URLSearchParams(searchParamsValue),
}))

function term(overrides: Partial<WPTerm> = {}): WPTerm {
    return { id: 1, slug: 'drama', name: 'Drama', count: 10, ...overrides } as WPTerm
}

describe('ProductionsFilterSelects', () => {
    beforeEach(() => {
        pushMock.mockClear()
        searchParamsValue = ''
    })

    it('não mostra o select de gênero quando a lista está vazia', () => {
        render(<ProductionsFilterSelects genres={[]} platforms={[term()]} />)
        expect(screen.queryByLabelText(/filtrar por gênero/i)).not.toBeInTheDocument()
        expect(screen.getByLabelText(/filtrar por plataforma/i)).toBeInTheDocument()
    })

    it('não mostra o select de plataforma quando a lista está vazia', () => {
        render(<ProductionsFilterSelects genres={[term()]} platforms={[]} />)
        expect(screen.getByLabelText(/filtrar por gênero/i)).toBeInTheDocument()
        expect(screen.queryByLabelText(/filtrar por plataforma/i)).not.toBeInTheDocument()
    })

    it('selecionar um gênero navega com o param genre e remove page', async () => {
        searchParamsValue = 'page=2'
        const user = userEvent.setup()
        render(<ProductionsFilterSelects genres={[term({ slug: 'romance', name: 'Romance' })]} platforms={[]} />)
        await user.selectOptions(screen.getByLabelText(/filtrar por gênero/i), 'romance')
        expect(pushMock).toHaveBeenCalledWith('/productions?genre=romance')
    })

    it('selecionar uma plataforma navega com o param platform', async () => {
        const user = userEvent.setup()
        render(<ProductionsFilterSelects genres={[]} platforms={[term({ slug: 'netflix', name: 'Netflix' })]} />)
        await user.selectOptions(screen.getByLabelText(/filtrar por plataforma/i), 'netflix')
        expect(pushMock).toHaveBeenCalledWith('/productions?platform=netflix')
    })

    it('preserva outros params existentes ao trocar de filtro', async () => {
        searchParamsValue = 'platform=netflix'
        const user = userEvent.setup()
        render(<ProductionsFilterSelects genres={[term({ slug: 'acao', name: 'Ação' })]} platforms={[]} currentPlatform="netflix" />)
        await user.selectOptions(screen.getByLabelText(/filtrar por gênero/i), 'acao')
        expect(pushMock).toHaveBeenCalledWith('/productions?platform=netflix&genre=acao')
    })

    it('voltar pra "Todos" remove o param da URL', async () => {
        searchParamsValue = 'genre=acao'
        const user = userEvent.setup()
        render(<ProductionsFilterSelects genres={[term({ slug: 'acao', name: 'Ação' })]} platforms={[]} currentGenre="acao" />)
        await user.selectOptions(screen.getByLabelText(/filtrar por gênero/i), '')
        expect(pushMock).toHaveBeenCalledWith('/productions')
    })
})
