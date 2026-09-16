// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { SearchInput } from './SearchInput'

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    usePathname: vi.fn(),
    useSearchParams: vi.fn(),
}))

const mockPush = vi.fn()

function setup(searchParams = '') {
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>)
    vi.mocked(usePathname).mockReturnValue('/productions')
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(searchParams) as unknown as ReturnType<typeof useSearchParams>)
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
        expect(mockPush).toHaveBeenCalledWith('/productions?search=bts')
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
        expect(mockPush).toHaveBeenCalledWith('/productions?q=x')
    })

    it('preserva outros query params já existentes na URL', async () => {
        setup('genre=drama')
        const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
        render(<SearchInput />)
        await user.type(screen.getByRole('textbox'), 'a')
        await vi.advanceTimersByTimeAsync(400)
        expect(mockPush).toHaveBeenCalledWith('/productions?genre=drama&search=a')
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
        expect(mockPush).toHaveBeenCalledWith('/productions?search=bt')
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
        expect(mockPush).toHaveBeenCalledWith('/productions')
        expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('sincroniza o valor exibido quando a prop "current" muda externamente (ex: navegação por link)', () => {
        const { rerender } = render(<SearchInput current="bts" />)
        expect(screen.getByRole('textbox')).toHaveValue('bts')
        rerender(<SearchInput current="blackpink" />)
        expect(screen.getByRole('textbox')).toHaveValue('blackpink')
    })
})
