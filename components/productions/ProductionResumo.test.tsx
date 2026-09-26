// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-intl', () => ({
    useLocale: () => 'pt',
    useTranslations: () => (chave: string, valores?: Record<string, string>) => valores?.title ? `${chave}:${valores.title}` : chave,
}))

import { ProductionResumo } from './ProductionResumo'
import type { WPArtist, WPTerm } from '@/lib/wordpress/types'

const plataforma = (id: number, name: string, slug: string) => ({ id, name, slug, taxonomy: 'production_platform', count: 1 }) as WPTerm
const ator = (id: number, nome: string, slug: string) => ({ id, slug, title: { rendered: nome }, featured_image_url: null }) as unknown as WPArtist

const base = {
    title: 'Snowdrop', synopsis: 'Uma história de amor durante a ditadura.', rating: 8.5, network: 'JTBC',
    releaseLabel: '18 de dez. de 2021', episodes: 16, durationMinutes: 86, status: null,
    platforms: [plataforma(1, 'Netflix', 'netflix')], cast: [ator(1, 'Jung Hae-in', 'jung-hae-in')], castRoles: new Map([['jung-hae-in', 'Su-ho']]),
}

describe('ProductionResumo', () => {
    it('mostra nota, sinopse curta e âncora para o texto completo', () => {
        render(<ProductionResumo {...base} />)
        expect(screen.getByText('8.5')).toBeInTheDocument()
        expect(screen.getByText(/ditadura/)).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /summary.readFull/ })).toHaveAttribute('href', '#sinopse')
    })

    it('onde assistir: cada plataforma leva à listagem filtrada, em bloco medido próprio', () => {
        const { container } = render(<ProductionResumo {...base} />)
        const link = screen.getByRole('link', { name: 'Netflix' })
        expect(link.getAttribute('href')).toMatch(/\?platform=netflix$/)
        expect(link.closest('[data-bloco]')).toHaveAttribute('data-bloco', 'ficha-producao-onde-assistir')
        expect(container.querySelector('[data-bloco="ficha-producao-resumo"]')).not.toBeNull()
    })

    it('sem plataforma não desenha o cartão (catálogo sem dado não ganha caixa vazia)', () => {
        const { container } = render(<ProductionResumo {...base} platforms={[]} />)
        expect(container.querySelector('[data-bloco="ficha-producao-onde-assistir"]')).toBeNull()
        expect(screen.queryByText('summary.whereToWatch')).toBeNull()
        expect(screen.queryByRole('link', { name: 'watchTrailer' })).toBeNull() // o hero já tem o trailer
    })

    it('elenco principal com link para a ficha, papel e bloco medido próprio', () => {
        render(<ProductionResumo {...base} />)
        const link = screen.getByRole('link', { name: /Jung Hae-in/ })
        expect(link).toHaveAttribute('href', '/artists/jung-hae-in')
        expect(screen.getByText('Su-ho')).toBeInTheDocument()
        expect(link.closest('[data-bloco]')).toHaveAttribute('data-bloco', 'ficha-producao-elenco-principal')
        expect(link.closest('[data-bloco]')).toHaveClass('lg:hidden') // desktop já tem o elenco na lateral
    })

    it('limita o elenco a 8 e oferece o elenco completo quando há mais', () => {
        const muitos = Array.from({ length: 12 }, (_, i) => ator(i + 1, `Ator ${i}`, `ator-${i}`))
        render(<ProductionResumo {...base} cast={muitos} />)
        expect(screen.getAllByRole('link', { name: /Ator \d/ })).toHaveLength(8)
        expect(screen.getByRole('link', { name: /summary.allCast/ })).toHaveAttribute('href', '#elenco')
    })
})
