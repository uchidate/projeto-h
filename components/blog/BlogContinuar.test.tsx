// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BlogContinuar } from './BlogContinuar'
import type { WPPost } from '@/lib/wordpress/types'

const vazio = { artists: [], productions: [], groups: [], foods: [], companies: [] }
const grupo = { id: 1, name: 'MEOVV', slug: 'meovv', image: null }

function post(id: number, titulo: string, extra: Partial<WPPost> = {}): WPPost {
    return {
        id, slug: `p-${id}`, title: { rendered: titulo }, excerpt: { rendered: `<p>Resumo ${id}</p>` },
        date: '2026-09-01T00:00:00', categories: [5], featured_image_url: null,
        _embedded: { 'wp:term': [[{ id: 5, name: 'K-Pop', slug: 'k-pop', taxonomy: 'category' }]] },
        ...extra,
    } as unknown as WPPost
}

describe('BlogContinuar', () => {
    const atual = post(1, 'Atual', { related_entities: { ...vazio, groups: [grupo] } })

    it('destaque traz título, resumo e o motivo por entidade compartilhada', () => {
        const destaque = post(2, 'Sobre o MEOVV', { related_entities: { ...vazio, groups: [grupo] } })
        render(<BlogContinuar atual={atual} candidatos={[destaque]} verMaisHref="/blog" />)
        expect(screen.getByText('Sobre o MEOVV')).toBeInTheDocument()
        expect(screen.getByText('Resumo 2')).toBeInTheDocument()
        expect(screen.getByText('Também fala de MEOVV')).toBeInTheDocument()
    })

    it('destaque sem entidade em comum cai para a categoria; cartões menores não repetem categoria', () => {
        const { container } = render(<BlogContinuar atual={atual} candidatos={[post(2, 'A'), post(3, 'B'), post(4, 'C')]} verMaisHref="/blog" />)
        expect(screen.getAllByText('Mais em K-Pop')).toHaveLength(1)
        expect(container.querySelector('a[href="/blog/p-2"]')).not.toBeNull()
    })

    it('grid dos cartões menores acompanha a quantidade (sem coluna vazia)', () => {
        const dois = render(<BlogContinuar atual={atual} candidatos={[post(2, 'A'), post(3, 'B'), post(4, 'C')]} verMaisHref="/blog" />)
        expect(dois.container.querySelector('.sm\\:grid-cols-2')).not.toBeNull()
        dois.unmount()
        const tres = render(<BlogContinuar atual={atual} candidatos={[post(2, 'A'), post(3, 'B'), post(4, 'C'), post(5, 'D')]} verMaisHref="/blog" />)
        expect(tres.container.querySelector('.sm\\:grid-cols-3')).not.toBeNull()
    })

    it('marca o bloco para a medição e não renderiza sem candidatos', () => {
        const { container, rerender } = render(<BlogContinuar atual={atual} candidatos={[post(2, 'A')]} verMaisHref="/blog" />)
        expect(container.querySelector('[data-bloco="artigo-continuar"]')).not.toBeNull()
        rerender(<BlogContinuar atual={atual} candidatos={[]} verMaisHref="/blog" />)
        expect(container).toBeEmptyDOMElement()
    })
})
