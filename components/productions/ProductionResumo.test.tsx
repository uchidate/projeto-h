// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-intl', () => ({
    useLocale: () => 'pt',
    useTranslations: () => (chave: string, valores?: Record<string, string>) => valores?.title ? `${chave}:${valores.title}` : chave,
}))

import { ProductionResumo } from './ProductionResumo'
import type { WPTerm } from '@/lib/wordpress/types'

const termo = (id: number, name: string, slug: string, taxonomy: string) => ({ id, name, slug, taxonomy, count: 1 }) as WPTerm

const base = {
    title: 'Snowdrop',
    synopsis: 'Uma história de amor durante a ditadura.',
    genres: [termo(1, 'Drama', 'drama', 'production_genre')],
    platforms: [termo(2, 'Netflix', 'netflix', 'production_platform')],
}

describe('ProductionResumo', () => {
    it('mostra a sinopse, os gêneros e a âncora para o dossiê', () => {
        render(<ProductionResumo {...base} />)
        expect(screen.getByText(/ditadura/)).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Drama' }).getAttribute('href')).toMatch(/\?genre=drama$/)
        expect(screen.getByRole('link', { name: /summary.readFull/ })).toHaveAttribute('href', '#dossie')
    })

    it('onde assistir: serviço verificado abre a busca dele com o título; os demais, a busca do JustWatch', () => {
        const { container } = render(<ProductionResumo {...base} platforms={[...base.platforms, termo(3, 'Prime Video', 'prime-video', 'production_platform')]} />)
        const cartao = container.querySelector('[data-bloco="ficha-producao-onde-assistir"]')!
        const netflix = screen.getByText('Netflix').closest('a')!
        const prime = screen.getByText('Prime Video').closest('a')!
        expect(netflix).toHaveAttribute('href', 'https://www.netflix.com/search?q=Snowdrop')
        expect(prime).toHaveAttribute('href', 'https://www.justwatch.com/br/busca?q=Snowdrop')
        for (const link of [netflix, prime]) {
            expect(link).toHaveAttribute('target', '_blank')
            expect(link.getAttribute('rel')).toContain('noopener')
            expect(cartao.contains(link)).toBe(true)
        }
        expect(container.querySelector('[data-bloco="ficha-producao-resumo"]')).not.toBeNull()
        expect(screen.getByRole('link', { name: 'sidebar.justWatch' })).toHaveAttribute('href', 'https://www.justwatch.com')
    })

    it('mantém um caminho interno para navegar por plataforma', () => {
        render(<ProductionResumo {...base} />)
        expect(screen.getByRole('link', { name: /summary.browseByPlatform/ }).getAttribute('href')).toBe('/productions')
    })

    it('no celular o cartão vem antes da sinopse (order-first), no desktop depois', () => {
        render(<ProductionResumo {...base} />)
        const cartao = screen.getByText('Netflix').closest('[data-bloco]')!
        expect(cartao.className).toContain('order-first')
        expect(cartao.className).toContain('lg:order-none')
    })

    it('sem plataforma não desenha o cartão nem o crédito (catálogo sem dado não ganha caixa vazia)', () => {
        const { container } = render(<ProductionResumo {...base} platforms={[]} />)
        expect(container.querySelector('[data-bloco="ficha-producao-onde-assistir"]')).toBeNull()
        expect(screen.queryByText('summary.whereToWatch')).toBeNull()
        expect(screen.queryByRole('link', { name: 'sidebar.justWatch' })).toBeNull()
    })

    it('sem sinopse não mostra parágrafo genérico', () => {
        const { container } = render(<ProductionResumo {...base} synopsis="" />)
        expect(container.querySelector('p.max-w-\\[760px\\]')).toBeNull()
    })
})
