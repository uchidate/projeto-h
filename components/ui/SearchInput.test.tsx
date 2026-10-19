// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePathname } from 'next/navigation'
import { navegarListagem } from '@/lib/listagem/navegar'
import { SearchInput } from './SearchInput'

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
}))

// Troca de listagem é navegação completa (lib/listagem/navegar.ts); aqui só se confere o destino.
vi.mock('@/lib/listagem/navegar', async orig => ({ ...(await orig<typeof import('@/lib/listagem/navegar')>()), navegarListagem: vi.fn() }))

const mockPush = vi.mocked(navegarListagem)

function setup(searchParams = '') {
    vi.mocked(usePathname).mockReturnValue('/productions')
    window.history.replaceState(null, '', `/productions${searchParams ? `?${searchParams}` : ''}`)
}

describe('SearchInput', () => {
    beforeEach(() => {
        mockPush.mockReset()
        setup()
        vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('não navega imediatamente ao digitar (debounce de 400ms)', async () => {
        const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
        render(<SearchInput />)
        await user.type(screen.getByRole('textbox'), 'bts')
        expect(mockPush).not.toHaveBeenCalled()
    })

    it('navega com o param de busca depois do debounce', async () => {
        const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
        render(<SearchInput />)
        await user.type(screen.getByRole('textbox'), 'bts')
        await vi.advanceTimersByTimeAsync(400)
        expect(mockPush).toHaveBeenCalledWith('/productions?search=bts', { manterFocoBusca: true })
    })

    it('reseta a paginação (remove ?page=) ao buscar', async () => {
        setup('page=3')
        const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
        render(<SearchInput />)
        await user.type(screen.getByRole('textbox'), 'jimin')
        await vi.advanceTimersByTimeAsync(400)
        const [url] = mockPush.mock.calls[0]
        expect(url).not.toContain('page=')
        expect(url).toContain('search=jimin')
    })

    it('usa o param customizado quando passado (ex: "q" em vez de "search")', async () => {
        const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
        render(<SearchInput param="q" />)
        await user.type(screen.getByRole('textbox'), 'x')
        await vi.advanceTimersByTimeAsync(400)
        expect(mockPush).toHaveBeenCalledWith('/productions?q=x', { manterFocoBusca: true })
    })

    it('preserva outros query params já existentes na URL', async () => {
        setup('genre=drama')
        const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
        render(<SearchInput />)
        await user.type(screen.getByRole('textbox'), 'a')
        await vi.advanceTimersByTimeAsync(400)
        expect(mockPush).toHaveBeenCalledWith('/productions?genre=drama&search=a', { manterFocoBusca: true })
    })

    it('digitar de novo antes do debounce cancela a navegação anterior', async () => {
        const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
        render(<SearchInput />)
        const input = screen.getByRole('textbox')
        await user.type(input, 'b')
        await vi.advanceTimersByTimeAsync(200)
        await user.type(input, 't')
        await vi.advanceTimersByTimeAsync(200)
        // só passaram 400ms desde o ÚLTIMO caractere, não desde o primeiro
        expect(mockPush).not.toHaveBeenCalled()
        await vi.advanceTimersByTimeAsync(200)
        expect(mockPush).toHaveBeenCalledTimes(1)
        expect(mockPush).toHaveBeenCalledWith('/productions?search=bt', { manterFocoBusca: true })
    })

    it('não mostra o botão de limpar quando o campo está vazio', () => {
        render(<SearchInput />)
        expect(screen.queryByRole('button', { name: /limpar busca/i })).not.toBeInTheDocument()
    })

    it('mostra o botão de limpar quando há texto, e limpar navega sem o param de busca', async () => {
        const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
        render(<SearchInput current="bts" />)
        expect(screen.getByRole('button', { name: /limpar busca/i })).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /limpar busca/i }))
        expect(mockPush).toHaveBeenCalledWith('/productions', { manterFocoBusca: true })
        expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('sincroniza o valor exibido quando a prop "current" muda externamente (ex: navegação por link)', () => {
        const { rerender } = render(<SearchInput current="bts" />)
        expect(screen.getByRole('textbox')).toHaveValue('bts')
        rerender(<SearchInput current="blackpink" />)
        expect(screen.getByRole('textbox')).toHaveValue('blackpink')
    })
})
