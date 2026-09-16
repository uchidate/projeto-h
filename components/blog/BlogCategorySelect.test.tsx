// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BlogCategorySelect } from './BlogCategorySelect'
import type { WPTerm } from '@/lib/wordpress/types'

const pushMock = vi.fn()
let searchParamsValue = ''

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, replace: vi.fn() }),
    usePathname: () => '/blog',
    useSearchParams: () => new URLSearchParams(searchParamsValue),
}))

function term(overrides: Partial<WPTerm> = {}): WPTerm {
    return { id: 1, slug: 'k-pop', name: 'K-pop', count: 5, ...overrides } as WPTerm
}

describe('BlogCategorySelect', () => {
    beforeEach(() => {
        pushMock.mockClear()
        searchParamsValue = ''
    })

    it('mostra a opção "Todas" e as categorias com contagem', () => {
        render(<BlogCategorySelect categories={[term(), term({ id: 2, slug: 'k-drama', name: 'K-drama', count: 3 })]} />)
        expect(screen.getByText('Todas')).toBeInTheDocument()
        expect(screen.getByText('K-pop (5)')).toBeInTheDocument()
        expect(screen.getByText('K-drama (3)')).toBeInTheDocument()
    })

    it('filtra a categoria "uncategorized" da lista', () => {
        render(<BlogCategorySelect categories={[term({ slug: 'uncategorized', name: 'Sem categoria' })]} />)
        expect(screen.queryByText(/sem categoria/i)).not.toBeInTheDocument()
    })

    it('selecionar uma categoria navega com o param category e remove page', async () => {
        searchParamsValue = 'page=3'
        const user = userEvent.setup()
        render(<BlogCategorySelect categories={[term()]} />)
        await user.selectOptions(screen.getByRole('combobox'), 'k-pop')
        expect(pushMock).toHaveBeenCalledWith('/blog?category=k-pop')
    })

    it('selecionar "Todas" remove o param category da URL', async () => {
        searchParamsValue = 'category=k-pop'
        const user = userEvent.setup()
        render(<BlogCategorySelect categories={[term()]} current="k-pop" />)
        await user.selectOptions(screen.getByRole('combobox'), '')
        expect(pushMock).toHaveBeenCalledWith('/blog')
    })

    it('usa "current" como valor selecionado', () => {
        render(<BlogCategorySelect categories={[term()]} current="k-pop" />)
        expect(screen.getByRole('combobox')).toHaveValue('k-pop')
    })
})
