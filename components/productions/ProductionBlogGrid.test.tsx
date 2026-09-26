// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-intl', () => ({ useTranslations: () => (chave: string) => chave }))

import { ProductionBlogGrid } from './ProductionBlogGrid'
import type { WPPost } from '@/lib/wordpress/types'

const post = (id: number, titulo: string, categorias: number[] = []) =>
    ({ id, slug: `p-${id}`, title: { rendered: titulo }, categories: categorias, featured_image_url: null }) as unknown as WPPost

describe('ProductionBlogGrid', () => {
    it('mostra até 3 matérias, com link e categoria quando o mapa a conhece', () => {
        render(<ProductionBlogGrid title="Gatilho" posts={[post(1, 'A', [5]), post(2, 'B'), post(3, 'C'), post(4, 'D')]} categoryMap={{ 5: { name: 'K-Drama', slug: 'k-drama' } }} />)
        expect(screen.getAllByRole('link').filter(l => l.getAttribute('href')?.startsWith('/blog/p-'))).toHaveLength(3)
        expect(screen.getByText('K-Drama')).toBeInTheDocument()
    })

    it('bloco medido e "ver mais" busca pelo título da produção', () => {
        const { container } = render(<ProductionBlogGrid title="Tudo Bem" posts={[post(1, 'A')]} />)
        expect(container.querySelector('[data-bloco="ficha-producao-blog"]')).not.toBeNull()
        expect(screen.getByRole('link', { name: /seeMore/ }).getAttribute('href')).toBe('/blog?search=Tudo%20Bem')
    })

    it('sem matérias não renderiza a seção', () => {
        const { container } = render(<ProductionBlogGrid title="X" posts={[]} />)
        expect(container).toBeEmptyDOMElement()
    })
})
