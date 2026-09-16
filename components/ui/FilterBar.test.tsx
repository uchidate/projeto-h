// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterBar, type FilterOption } from './FilterBar'

const pushMock = vi.fn()
let searchParamsValue = ''

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, replace: vi.fn() }),
    usePathname: () => '/artists',
    useSearchParams: () => new URLSearchParams(searchParamsValue),
}))

function options(): FilterOption[] {
    return [{ value: 'singer', label: 'Cantor' }, { value: 'actor', label: 'Ator' }]
}

describe('FilterBar', () => {
    beforeEach(() => {
        pushMock.mockClear()
        searchParamsValue = ''
    })

    it('mostra o label do grupo e os botões de opção', () => {
        render(<FilterBar groups={[{ label: 'Role', param: 'role', options: options() }]} />)
        expect(screen.getByText('Role')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Cantor' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Ator' })).toBeInTheDocument()
    })

    it('destaca visualmente a opção atualmente selecionada', () => {
        render(<FilterBar groups={[{ label: 'Role', param: 'role', options: options(), current: 'singer' }]} />)
        expect(screen.getByRole('button', { name: 'Cantor' })).toHaveClass('bg-foreground')
        expect(screen.getByRole('button', { name: 'Ator' })).not.toHaveClass('bg-foreground')
    })

    it('clicar numa opção navega com o param setado e remove page', async () => {
        searchParamsValue = 'page=2'
        const user = userEvent.setup()
        render(<FilterBar groups={[{ label: 'Role', param: 'role', options: options() }]} />)
        await user.click(screen.getByRole('button', { name: 'Cantor' }))
        expect(pushMock).toHaveBeenCalledWith('/artists?role=singer')
    })

    it('renderiza múltiplos grupos de filtro independentes', () => {
        render(<FilterBar groups={[
            { label: 'Role', param: 'role', options: options() },
            { label: 'Gênero', param: 'gender', options: [{ value: 'f', label: 'Feminino' }] },
        ]} />)
        expect(screen.getByText('Role')).toBeInTheDocument()
        expect(screen.getByText('Gênero')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Feminino' })).toBeInTheDocument()
    })

    it('preserva outros params ao alterar um filtro', async () => {
        searchParamsValue = 'gender=f'
        const user = userEvent.setup()
        render(<FilterBar groups={[{ label: 'Role', param: 'role', options: options() }]} />)
        await user.click(screen.getByRole('button', { name: 'Ator' }))
        expect(pushMock).toHaveBeenCalledWith('/artists?gender=f&role=actor')
    })
})
