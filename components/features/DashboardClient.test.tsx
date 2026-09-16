// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signOut } from 'next-auth/react'
import { DashboardClient } from './DashboardClient'
import type { WPProduction } from '@/lib/wordpress/types'

vi.mock('next-auth/react', () => ({ signOut: vi.fn() }))
vi.mock('@/components/productions/ProductionCard', () => ({ ProductionCard: ({ production }: { production: WPProduction }) => <div>{production.title.rendered}</div> }))

const mockedSignOut = vi.mocked(signOut)

function production(overrides: Partial<WPProduction> = {}): WPProduction {
    return { id: 1, slug: 'x', title: { rendered: 'Produção X' }, ...overrides } as unknown as WPProduction
}

function baseProps() {
    return {
        user: { name: 'Pessoa Teste', email: 'x@x.com', image: null },
        stats: { favoritesCount: 0, watchlistCount: 0, joinDate: '2026-01-01', daysSinceJoin: 10 },
        favProductions: [],
        watchProductions: [],
        watchingProductions: [],
        savedPosts: [],
        readPosts: [],
        followedArtists: [],
        followedGroups: [],
        latestPosts: [],
    }
}

describe('DashboardClient', () => {
    it('mostra apenas o primeiro nome no cumprimento', () => {
        render(<DashboardClient {...baseProps()} />)
        expect(screen.getByText(/olá, pessoa/i)).toBeInTheDocument()
    })

    it('mostra o empty state quando não há nenhuma atividade', () => {
        render(<DashboardClient {...baseProps()} />)
        expect(screen.getByText('Monte sua coleção')).toBeInTheDocument()
    })

    it('não mostra o empty state quando há favoritos', () => {
        render(<DashboardClient {...baseProps()} stats={{ ...baseProps().stats, favoritesCount: 1 }} favProductions={[production()]} />)
        expect(screen.queryByText('Monte sua coleção')).not.toBeInTheDocument()
        expect(screen.getByText('Favoritos recentes')).toBeInTheDocument()
    })

    it('usa "Novo por aqui" como profileLevel quando não há coleção', () => {
        render(<DashboardClient {...baseProps()} />)
        expect(screen.getByText('Novo por aqui')).toBeInTheDocument()
    })

    it('usa "Coleção começando" com 1-7 itens salvos', () => {
        render(<DashboardClient {...baseProps()} stats={{ ...baseProps().stats, favoritesCount: 3 }} />)
        expect(screen.getByText('Coleção começando')).toBeInTheDocument()
    })

    it('usa "Explorador em ritmo forte" com 8-19 itens', () => {
        render(<DashboardClient {...baseProps()} stats={{ ...baseProps().stats, favoritesCount: 10 }} />)
        expect(screen.getByText('Explorador em ritmo forte')).toBeInTheDocument()
    })

    it('usa "Curador dedicado" com 20+ itens', () => {
        render(<DashboardClient {...baseProps()} stats={{ ...baseProps().stats, favoritesCount: 20 }} />)
        expect(screen.getByText('Curador dedicado')).toBeInTheDocument()
    })

    it('mostra a meta de favoritos como "1" quando favoritesCount é 0', () => {
        render(<DashboardClient {...baseProps()} />)
        expect(screen.getByText('Meta: 1 favorito')).toBeInTheDocument()
    })

    it('mostra "Meta de favoritos concluída" quando >= 20', () => {
        render(<DashboardClient {...baseProps()} stats={{ ...baseProps().stats, favoritesCount: 25 }} />)
        expect(screen.getByText('Meta de favoritos concluída')).toBeInTheDocument()
    })

    it('a ação "Favoritar" muda de label quando já há favoritos', () => {
        render(<DashboardClient {...baseProps()} stats={{ ...baseProps().stats, favoritesCount: 1 }} />)
        expect(screen.getByText('Revisitar favoritos')).toBeInTheDocument()
        expect(screen.queryByText('Favoritar a primeira produção')).not.toBeInTheDocument()
    })

    it('clicar em Sair chama signOut com callbackUrl "/"', async () => {
        const user = userEvent.setup()
        render(<DashboardClient {...baseProps()} />)
        await user.click(screen.getByRole('button', { name: /sair/i }))
        expect(mockedSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })

    it('mostra o stat card de "Dias no site" quando daysSinceJoin não é null', () => {
        render(<DashboardClient {...baseProps()} />)
        expect(screen.getByText('Dias no site')).toBeInTheDocument()
    })

    it('não mostra o stat card de dias quando daysSinceJoin é null', () => {
        render(<DashboardClient {...baseProps()} stats={{ ...baseProps().stats, daysSinceJoin: null }} />)
        expect(screen.queryByText('Dias no site')).not.toBeInTheDocument()
    })

    it('mostra a seção "Continuar assistindo" apenas quando há produções assistindo', () => {
        const { container } = render(<DashboardClient {...baseProps()} stats={{ ...baseProps().stats, favoritesCount: 1 }} watchingProductions={[production({ id: 2, title: { rendered: 'Assistindo X' } })]} />)
        expect(screen.getByText('Continuar assistindo')).toBeInTheDocument()
        expect(container.textContent).toContain('Assistindo X')
    })
})
