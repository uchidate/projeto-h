// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MinhasListasClient } from './MinhasListasClient'
import type { WPProduction } from '@/lib/wordpress/types'

vi.mock('@/components/productions/ProductionCard', () => ({
    ProductionCard: ({ production }: { production: WPProduction }) => <div>{production.title.rendered}</div>,
}))

function production(overrides: Partial<WPProduction> = {}): WPProduction {
    return { id: 1, title: { rendered: 'Produção Teste' }, slug: 'x', ...overrides } as unknown as WPProduction
}

function baseProps() {
    return {
        initialTab: 'favoritos' as const,
        favProductions: [],
        watchProductions: [],
        watchingProductions: [],
        watchedProductions: [],
        favoriteIds: [],
        watchlistIds: [],
        watchingIds: [],
        watchedIds: [],
    }
}

describe('MinhasListasClient', () => {
    it('mostra as contagens de cada categoria no header', () => {
        render(<MinhasListasClient {...baseProps()} favoriteIds={[1, 2]} watchlistIds={[3]} watchingIds={[4, 5, 6]} />)
        expect(screen.getByText('favoritos').previousElementSibling).toHaveTextContent('2')
        expect(screen.getByText('quero ver').previousElementSibling).toHaveTextContent('1')
        expect(screen.getByText('assistindo').previousElementSibling).toHaveTextContent('3')
    })

    it('soma o total de "jornada" a partir de todas as 4 listas', () => {
        render(<MinhasListasClient {...baseProps()} favoriteIds={[1]} watchlistIds={[2]} watchingIds={[3]} watchedIds={[4]} />)
        expect(screen.getByText('jornada').previousElementSibling).toHaveTextContent('4')
    })

    it('mostra o empty state específico da aba "favoritos"', () => {
        render(<MinhasListasClient {...baseProps()} />)
        expect(screen.getByText('Nenhum favorito ainda')).toBeInTheDocument()
    })

    it('usa initialTab para determinar a aba ativa e a cópia exibida', () => {
        render(<MinhasListasClient {...baseProps()} initialTab="assistindo" />)
        expect(screen.getByText('Nada em andamento')).toBeInTheDocument()
    })

    it('clicar numa aba troca o conteúdo e a cópia exibida', async () => {
        const user = userEvent.setup()
        render(<MinhasListasClient {...baseProps()} />)
        await user.click(screen.getByRole('button', { name: /assistidos/i }))
        expect(screen.getByText('Nenhum assistido ainda')).toBeInTheDocument()
    })

    it('mostra as produções da aba ativa quando há itens', () => {
        render(<MinhasListasClient {...baseProps()} favProductions={[production({ title: { rendered: 'Meu Favorito' } })]} favoriteIds={[1]} />)
        expect(screen.getByText('Meu Favorito')).toBeInTheDocument()
        expect(screen.queryByText('Nenhum favorito ainda')).not.toBeInTheDocument()
    })

    it('usa singular "produção" para contagem 1', () => {
        render(<MinhasListasClient {...baseProps()} favProductions={[production()]} favoriteIds={[1]} />)
        expect(screen.getByText('1 produção')).toBeInTheDocument()
    })

    it('usa plural "produções" para contagem > 1 (sem duplicar "ão")', () => {
        render(<MinhasListasClient {...baseProps()} favProductions={[production(), production({ id: 2 })]} favoriteIds={[1, 2]} />)
        expect(screen.getByText('2 produções')).toBeInTheDocument()
        expect(screen.queryByText(/produçãoões/)).not.toBeInTheDocument()
    })
})
