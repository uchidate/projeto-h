// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock parcial: `labelsFor` usa `createTranslator` do mesmo módulo.
vi.mock('next-intl', async (importarOriginal) => ({
    ...(await importarOriginal<typeof import('next-intl')>()),
    useLocale: () => 'pt',
    useTranslations: () => (chave: string, valores?: Record<string, unknown>) => (valores ? `${chave}:${JSON.stringify(valores)}` : chave),
}))
vi.mock('@/components/profiles/ProfileSidebarAd', () => ({ ProfileSidebarAd: () => null }))

import { FichaLinhas, ProductionSidebar } from './ProductionSidebar'

const dados = { type: 'drama', year: 2024, episodes: 36, durationMinutes: 70, network: 'KBS2', statusProduction: 'completed' }

describe('FichaLinhas', () => {
    it('lista (lateral): rótulos e valores, com o tipo alinhado à direita', () => {
        const { container } = render(<FichaLinhas {...dados} />)
        expect(screen.getByText('sidebar.year')).toBeInTheDocument()
        expect(screen.getByText('2024')).toBeInTheDocument()
        expect(container.querySelector('.justify-end')).not.toBeNull()
    })

    it('grade (celular): duas colunas e o tipo alinhado à esquerda, como os demais valores', () => {
        const { container } = render(<FichaLinhas {...dados} grade />)
        expect(container.firstElementChild!.className).toContain('grid-cols-2')
        expect(container.querySelector('.justify-end')).toBeNull()
        expect(container.querySelector('.justify-start')).not.toBeNull()
    })
})

describe('ProductionSidebar compacto', () => {
    const props = { rating: 6.4, platforms: [], ...dados }

    it('modo compacto mostra só a ficha: sem nota, elenco nem plataformas', () => {
        render(<ProductionSidebar {...props} compacto platforms={[{ id: 1, name: 'Netflix', slug: 'netflix', taxonomy: 'production_platform', count: 1 }]} />)
        expect(screen.queryByText('sidebar.rating')).toBeNull()
        expect(screen.queryByText('sidebar.mainCast')).toBeNull()
        expect(screen.queryByText('Netflix')).toBeNull()
        expect(screen.getByText('sidebar.technical')).toBeInTheDocument()
    })

    it('modo normal segue mostrando a nota (a estrutura atual não muda)', () => {
        render(<ProductionSidebar {...props} />)
        expect(screen.getByText('sidebar.rating')).toBeInTheDocument()
    })
})
