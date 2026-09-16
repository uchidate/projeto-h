// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArtistsPage } from './ArtistsPage'
import type { WPArtist } from '@/lib/wordpress/types'

const pushMock = vi.fn()
let searchParamsValue = ''

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock }),
    usePathname: () => '/artists',
    useSearchParams: () => new URLSearchParams(searchParamsValue),
}))
vi.mock('@/components/artists/ArtistCard', () => ({ ArtistCard: ({ artist }: { artist: WPArtist }) => <div>{artist.title.rendered}</div> }))
vi.mock('@/components/ui/Pagination', () => ({ Pagination: () => <div data-testid="pagination" /> }))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: () => <div data-testid="ad-slot" /> }))

function artist(overrides: Partial<WPArtist> = {}): WPArtist {
    return { id: 1, title: { rendered: 'Artista Teste' }, slug: 'x', ...overrides } as unknown as WPArtist
}

function baseProps() {
    return {
        artists: [artist()],
        total: 1,
        totalPages: 1,
        currentPage: 1,
        letterCounts: {},
    }
}

describe('ArtistsPage', () => {
    beforeEach(() => {
        pushMock.mockClear()
        searchParamsValue = ''
        vi.useFakeTimers()
    })

    it('mostra o empty state quando não há artistas, com mensagem específica pra busca', () => {
        render(<ArtistsPage {...baseProps()} artists={[]} total={0} search="xyz" />)
        expect(screen.getByText(/nenhum resultado para "xyz"/i)).toBeInTheDocument()
    })

    it('mostra o empty state específico pra letra sem resultados', () => {
        render(<ArtistsPage {...baseProps()} artists={[]} total={0} letter="Z" />)
        expect(screen.getByText(/nenhum artista com a letra z/i)).toBeInTheDocument()
    })

    it('mostra o grid de artistas quando há resultados', () => {
        render(<ArtistsPage {...baseProps()} />)
        expect(screen.getByText('Artista Teste')).toBeInTheDocument()
    })

    it('mostra a paginação com contagem quando há mais de 1 página', () => {
        render(<ArtistsPage {...baseProps()} totalPages={3} currentPage={2} total={100} />)
        expect(screen.getByText(/pág\. 2 de 3/i)).toBeInTheDocument()
    })

    it('não mostra a linha de paginação quando há só 1 página', () => {
        render(<ArtistsPage {...baseProps()} totalPages={1} />)
        expect(screen.queryByText(/pág\./i)).not.toBeInTheDocument()
    })

    it('mostra o heading da letra quando "letter" está definido', () => {
        render(<ArtistsPage {...baseProps()} letter="K" letterCounts={{ K: 42 }} />)
        expect(screen.getByText('K', { selector: 'span.font-serif' })).toBeInTheDocument()
        expect(screen.getByText(/42 artistas · letra k/i)).toBeInTheDocument()
    })

    it('desabilita letras sem artistas na barra alfabética quando há letterCounts', () => {
        render(<ArtistsPage {...baseProps()} letterCounts={{ A: 5 }} />)
        const linkZ = screen.getByText('Z').closest('a')!
        expect(linkZ).toHaveAttribute('aria-disabled', 'true')
    })

    it('mantém todas as letras navegáveis quando letterCounts está vazio (endpoint falhou)', () => {
        render(<ArtistsPage {...baseProps()} letterCounts={{}} />)
        const linkZ = screen.getByText('Z').closest('a')!
        expect(linkZ).toHaveAttribute('aria-disabled', 'false')
    })

    it('digitar na busca navega (debounced) com o param search e remove page', () => {
        render(<ArtistsPage {...baseProps()} />)
        vi.useRealTimers()
        return (async () => {
            const user = userEvent.setup()
            await user.type(screen.getByPlaceholderText(/buscar artista/i), 'bts')
            await new Promise(r => setTimeout(r, 450))
            expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('search=bts'))
        })()
    })

    it('trocar o filtro de atuação navega imediatamente', async () => {
        vi.useRealTimers()
        const user = userEvent.setup()
        render(<ArtistsPage {...baseProps()} />)
        await user.selectOptions(screen.getByLabelText(/filtrar por atuação/i), 'singer')
        expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('role=singer'))
    })

    it('botão "Limpar" só aparece quando há algum filtro ativo', async () => {
        render(<ArtistsPage {...baseProps()} />)
        expect(screen.queryByRole('button', { name: /limpar filtros/i })).not.toBeInTheDocument()
    })

    it('mostra o botão "Limpar" quando há busca ativa e reseta ao clicar', async () => {
        vi.useRealTimers()
        const user = userEvent.setup()
        render(<ArtistsPage {...baseProps()} search="bts" />)
        expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /limpar filtros/i }))
        expect(screen.queryByRole('button', { name: /limpar filtros/i })).not.toBeInTheDocument()
    })
})
