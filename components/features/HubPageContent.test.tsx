// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HubPageContent } from './HubPageContent'
import type { ArchiveHub } from '@/lib/guias'
import type { WPProduction } from '@/lib/wordpress/types'

vi.mock('@/components/productions/ProductionCard', () => ({ ProductionCard: ({ production }: { production: WPProduction }) => <div>{production.title.rendered}</div> }))
vi.mock('@/components/artists/ArtistCard', () => ({ ArtistCard: () => <div /> }))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: () => <div data-testid="ad-slot" /> }))
vi.mock('@/components/ui/ScrollToTop', () => ({ ScrollToTop: () => null }))

class MockResizeObserver {
    observe = vi.fn()
    disconnect = vi.fn()
}

function hub(overrides: Partial<ArchiveHub> = {}): ArchiveHub {
    return {
        slug: 'doramas-romanticos',
        kind: 'productions',
        title: 'Doramas Românticos',
        shortTitle: 'Românticos',
        description: 'Os melhores doramas de romance',
        intro: [],
        keywords: [],
        faq: [],
        filter: {},
        ...overrides,
    }
}

function production(overrides: Partial<WPProduction> = {}): WPProduction {
    return { id: 1, slug: 'x', title: { rendered: 'Produção X' }, ...overrides } as unknown as WPProduction
}

describe('HubPageContent', () => {
    beforeEach(() => {
        // @ts-expect-error mock global
        global.ResizeObserver = MockResizeObserver
    })

    it('mostra o empty state quando não há itens', () => {
        render(<HubPageContent hub={hub()} relatedHubs={[]} productions={[]} total={0} />)
        expect(screen.getByText(/nenhum resultado encontrado/i)).toBeInTheDocument()
    })

    it('mostra o grid de produções quando há itens', () => {
        render(<HubPageContent hub={hub()} relatedHubs={[]} productions={[production()]} total={1} />)
        expect(screen.getByText('Produção X')).toBeInTheDocument()
    })

    it('mostra o total e o "kind" corretos no eyebrow', () => {
        render(<HubPageContent hub={hub()} relatedHubs={[]} productions={[production()]} total={57} />)
        expect(screen.getAllByText(/57 produções/i).length).toBeGreaterThan(0)
    })

    it('mostra "Explorar — página N" quando page > 1', () => {
        render(<HubPageContent hub={hub()} relatedHubs={[]} productions={[production()]} total={1} page={2} />)
        expect(screen.getByText(/explorar — página 2/i)).toBeInTheDocument()
    })

    it('não mostra o link "Limpar" sem filtros ativos', () => {
        render(<HubPageContent hub={hub()} relatedHubs={[]} productions={[production()]} total={1} />)
        expect(screen.queryByText(/limpar ×/i)).not.toBeInTheDocument()
    })

    it('mostra o link "Limpar" quando há filtro ativo', () => {
        render(<HubPageContent hub={hub()} relatedHubs={[]} productions={[production()]} total={1} activeFilters={{ type: 'drama' }} />)
        expect(screen.getByText(/limpar ×/i)).toBeInTheDocument()
    })

    it('mostra filtros de tipo/plataforma/ano quando hub.kind é "productions" e não é a própria dimensão', () => {
        render(<HubPageContent hub={hub()} relatedHubs={[]} productions={[production()]} total={1} />)
        expect(screen.getByText('Tipo')).toBeInTheDocument()
        expect(screen.getByText('Plataforma')).toBeInTheDocument()
        expect(screen.getByText('Ano')).toBeInTheDocument()
    })

    it('não mostra filtros para hub.kind "artists"', () => {
        render(<HubPageContent hub={hub({ kind: 'artists', slug: 'atores' })} relatedHubs={[]} artists={[]} total={0} />)
        expect(screen.queryByText('Tipo')).not.toBeInTheDocument()
    })

    it('mostra as FAQs apenas na página 1', () => {
        const h = hub({ faq: [{ question: 'Pergunta?', answer: 'Resposta.' }] })
        const { rerender } = render(<HubPageContent hub={h} relatedHubs={[]} productions={[production()]} total={1} page={1} />)
        expect(screen.getByText('Pergunta?')).toBeInTheDocument()

        rerender(<HubPageContent hub={h} relatedHubs={[]} productions={[production()]} total={1} page={2} />)
        expect(screen.queryByText('Pergunta?')).not.toBeInTheDocument()
    })

    it('mostra guias relacionados apenas na página 1', () => {
        const related = [hub({ slug: 'outro', shortTitle: 'Outro Guia' })]
        const { rerender } = render(<HubPageContent hub={hub()} relatedHubs={related} productions={[production()]} total={1} page={1} />)
        expect(screen.getByText('Outro Guia')).toBeInTheDocument()

        rerender(<HubPageContent hub={hub()} relatedHubs={related} productions={[production()]} total={1} page={2} />)
        expect(screen.queryByText('Outro Guia')).not.toBeInTheDocument()
    })

    it('mostra a paginação apenas quando totalPages > 1', () => {
        const { rerender } = render(<HubPageContent hub={hub()} relatedHubs={[]} productions={[production()]} total={1} totalPages={1} />)
        expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument()

        rerender(<HubPageContent hub={hub()} relatedHubs={[]} productions={[production()]} total={100} totalPages={3} page={2} />)
        expect(screen.getByRole('navigation', { name: 'Paginação' })).toBeInTheDocument()
    })
})
