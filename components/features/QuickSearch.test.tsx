// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { useQuickSearch } from '@/lib/hooks/useQuickSearch'
import { useWPSearch } from '@/hooks/useWPSearch'
import { QuickSearch } from './QuickSearch'
import type { SearchResult } from '@/lib/search/types'

vi.mock('next/navigation', () => ({ useRouter: vi.fn() }))
vi.mock('@/hooks/useWPSearch', () => ({ useWPSearch: vi.fn() }))

const mockPush = vi.fn()

function result(overrides: Partial<SearchResult> = {}): SearchResult {
    return { id: 1, title: 'Jimin', href: '/artists/jimin', type: 'artist', ...overrides }
}

describe('QuickSearch', () => {
    beforeEach(() => {
        mockPush.mockReset()
        vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>)
        vi.mocked(useWPSearch).mockReturnValue({ results: [], isLoading: false, erro: false })
        useQuickSearch.setState({ isOpen: false })
    })

    afterEach(() => {
        useQuickSearch.setState({ isOpen: false })
    })

    it('não renderiza nada quando fechado', () => {
        const { container } = render(<QuickSearch />)
        expect(container).toBeEmptyDOMElement()
    })

    it('renderiza o modal quando isOpen é true (via store)', () => {
        useQuickSearch.setState({ isOpen: true })
        render(<QuickSearch />)
        expect(screen.getByRole('dialog', { name: /busca rápida/i })).toBeInTheDocument()
    })

    it('mostra os atalhos de acesso rápido quando a query tem menos de 2 caracteres', () => {
        useQuickSearch.setState({ isOpen: true })
        render(<QuickSearch />)
        expect(screen.getByText(/acesso rápido/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /doramas/i })).toBeInTheDocument()
    })

    it('agrupa por tipo na ordem de relevância (o tipo do melhor resultado vem primeiro), com plural correto', async () => {
        vi.mocked(useWPSearch).mockReturnValue({
            results: [
                result({ id: 1, type: 'post', title: 'Um artigo' }),
                result({ id: 2, type: 'production', title: 'Um drama' }),
                result({ id: 3, type: 'artist', title: 'Um artista' }),
            ],
            isLoading: false, erro: false,
        })
        useQuickSearch.setState({ isOpen: true })
        const user = userEvent.setup()
        render(<QuickSearch />)
        await user.type(screen.getByRole('combobox'), 'xx') // sai do zero-state (query >= 2 chars)
        const headings = screen.getAllByText(/^(Produções|Artistas|Grupos|Artigos)$/).map(el => el.textContent)
        expect(headings).toEqual(['Artigos', 'Produções', 'Artistas'])
    })

    it('"bts": o grupo (melhor resultado) aparece antes das produções', async () => {
        vi.mocked(useWPSearch).mockReturnValue({
            results: [
                result({ id: 1, type: 'group', title: 'BTS' }),
                result({ id: 2, type: 'production', title: 'BTS: Bon Voyage' }),
            ],
            isLoading: false, erro: false,
        })
        useQuickSearch.setState({ isOpen: true })
        const user = userEvent.setup()
        render(<QuickSearch />)
        await user.type(screen.getByRole('combobox'), 'bts')
        const headings = screen.getAllByText(/^(Produções|Grupos)$/).map(el => el.textContent)
        expect(headings).toEqual(['Grupos', 'Produções'])
    })

    it('clicar num resultado registra search_click com a posição exibida', async () => {
        const gtag = vi.fn()
        ;(window as unknown as { gtag: unknown }).gtag = gtag
        vi.mocked(useWPSearch).mockReturnValue({
            results: [
                result({ id: 1, type: 'group', title: 'BTS', href: '/groups/bts' }),
                result({ id: 2, type: 'production', title: 'BTS: Bon Voyage', href: '/productions/bts-bon-voyage' }),
            ],
            isLoading: false, erro: false,
        })
        useQuickSearch.setState({ isOpen: true })
        const user = userEvent.setup()
        render(<QuickSearch />)
        await user.type(screen.getByRole('combobox'), 'bts')
        await user.click(screen.getByRole('option', { name: /Bon Voyage/ }))
        expect(gtag).toHaveBeenCalledWith('event', 'search_click', expect.objectContaining({
            search_term: 'bts', position: 2, result_type: 'production', result_href: '/productions/bts-bon-voyage',
        }))
        delete (window as unknown as { gtag?: unknown }).gtag
    })

    it('mostra "Nenhum resultado" quando a busca não retorna nada', async () => {
        vi.mocked(useWPSearch).mockReturnValue({ results: [], isLoading: false, erro: false })
        useQuickSearch.setState({ isOpen: true })
        const user = userEvent.setup()
        render(<QuickSearch />)
        await user.type(screen.getByRole('combobox'), 'algo')
        expect(screen.getByText(/nenhum resultado para/i)).toBeInTheDocument()
    })

    // Nestes 3 testes não digitamos no input de propósito: user.type() dispara
    // onChange a cada tecla, que zera activeIndex pra -1 (só volta a 0 quando
    // o array de "results" muda de referência, o que só acontece de verdade
    // quando a busca debounced resolve — não com um mock estático). Sem
    // digitar, activeIndex já nasce em 0 (efeito de montagem) e navegamos
    // direto com as setas, testando exatamente a lógica de handleSubmit/
    // handleInputKeyDown, sem depender do timing do hook de busca real.
    it('Enter no primeiro resultado navega pra ele (activeIndex inicial = 0)', async () => {
        vi.mocked(useWPSearch).mockReturnValue({ results: [result({ href: '/artists/jimin' })], isLoading: false, erro: false })
        useQuickSearch.setState({ isOpen: true })
        const user = userEvent.setup()
        render(<QuickSearch />)
        screen.getByRole('combobox').focus()
        await user.keyboard('{Enter}')
        expect(mockPush).toHaveBeenCalledWith('/artists/jimin')
    })

    it('seta para baixo avança o activeIndex com wraparound', async () => {
        vi.mocked(useWPSearch).mockReturnValue({
            results: [result({ id: 1, href: '/a' }), result({ id: 2, href: '/b' })],
            isLoading: false, erro: false,
        })
        useQuickSearch.setState({ isOpen: true })
        const user = userEvent.setup()
        render(<QuickSearch />)
        screen.getByRole('combobox').focus()
        await user.keyboard('{ArrowDown}{ArrowDown}') // 0→1→0 (wraparound com 2 itens)
        await user.keyboard('{Enter}')
        expect(mockPush).toHaveBeenCalledWith('/a')
    })

    it('seta para cima com activeIndex 0 vai pro último item (wraparound)', async () => {
        vi.mocked(useWPSearch).mockReturnValue({
            results: [result({ id: 1, href: '/a' }), result({ id: 2, href: '/b' })],
            isLoading: false, erro: false,
        })
        useQuickSearch.setState({ isOpen: true })
        const user = userEvent.setup()
        render(<QuickSearch />)
        screen.getByRole('combobox').focus()
        await user.keyboard('{ArrowUp}')
        await user.keyboard('{Enter}')
        expect(mockPush).toHaveBeenCalledWith('/b')
    })

    it('submeter sem selecionar nenhum resultado, mas com texto, navega pra /search?q=', async () => {
        vi.mocked(useWPSearch).mockReturnValue({ results: [], isLoading: false, erro: false })
        useQuickSearch.setState({ isOpen: true })
        const user = userEvent.setup()
        render(<QuickSearch />)
        await user.type(screen.getByRole('combobox'), 'bts')
        await user.keyboard('{Enter}')
        expect(mockPush).toHaveBeenCalledWith('/search?q=bts')
    })

    it('clicar em "Limpar" (X) esvazia a query', async () => {
        useQuickSearch.setState({ isOpen: true })
        const user = userEvent.setup()
        render(<QuickSearch />)
        const input = screen.getByRole('combobox') as HTMLInputElement
        await user.type(input, 'bts')
        expect(input.value).toBe('bts')
        await user.click(screen.getByRole('button', { name: /limpar/i }))
        expect(input.value).toBe('')
    })

    it('clicar no botão ESC fecha o modal', async () => {
        useQuickSearch.setState({ isOpen: true })
        const user = userEvent.setup()
        render(<QuickSearch />)
        await user.click(screen.getByRole('button', { name: /fechar/i }))
        expect(useQuickSearch.getState().isOpen).toBe(false)
    })

    it('clicar num atalho de acesso rápido navega pro href correspondente', async () => {
        useQuickSearch.setState({ isOpen: true })
        const user = userEvent.setup()
        render(<QuickSearch />)
        await user.click(screen.getByRole('button', { name: /artistas/i }))
        expect(mockPush).toHaveBeenCalledWith('/artists')
    })

    describe('telemetria da busca', () => {
        let gtag: ReturnType<typeof vi.fn>
        const buscas = () => gtag.mock.calls.filter(c => c[1] === 'search')

        beforeEach(() => {
            vi.useFakeTimers({ shouldAdvanceTime: true })
            gtag = vi.fn()
            ;(window as unknown as { gtag: unknown }).gtag = gtag
        })
        afterEach(() => { vi.useRealTimers() })

        it('registra uma vez a consulta estável, não cada tecla', async () => {
            useQuickSearch.setState({ isOpen: true })
            const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
            render(<QuickSearch />)
            await user.type(screen.getByRole('combobox'), 'ella')
            expect(buscas()).toHaveLength(0)
            await vi.advanceTimersByTimeAsync(1300)
            expect(buscas()).toHaveLength(1)
            expect(buscas()[0][2]).toMatchObject({ search_term: 'ella', result_count: 0 })
        })

        it('falha da API não conta como "sem resultado"', async () => {
            vi.mocked(useWPSearch).mockReturnValue({ results: [], isLoading: false, erro: true })
            useQuickSearch.setState({ isOpen: true })
            const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
            render(<QuickSearch />)
            await user.type(screen.getByRole('combobox'), 'riize')
            await vi.advanceTimersByTimeAsync(1300)
            expect(buscas()).toHaveLength(0)
        })
    })
})
