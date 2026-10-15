// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BlogSugestaoMeio } from './BlogSugestaoMeio'
import type { WPPost } from '@/lib/wordpress/types'

function post(id: number, titulo: string): WPPost {
    return {
        id, slug: `p-${id}`, title: { rendered: titulo }, excerpt: { rendered: '' },
        date: '2026-09-01T00:00:00', categories: [5], featured_image_url: null,
        _embedded: { 'wp:term': [[{ id: 5, name: 'K-Pop', slug: 'k-pop', taxonomy: 'category' }]] },
    } as unknown as WPPost
}

describe('BlogSugestaoMeio', () => {
    it('renderiza link, título e marca o bloco para a medição', () => {
        const { container } = render(<BlogSugestaoMeio atual={post(1, 'Atual')} candidato={post(2, 'Próxima leitura')} />)
        expect(screen.getByText('Próxima leitura')).toBeInTheDocument()
        expect(container.querySelector('a[href="/blog/p-2"]')).not.toBeNull()
        expect(container.querySelector('[data-bloco="artigo-meio"]')).not.toBeNull()
    })

    it('sem candidato não renderiza nada', () => {
        const { container } = render(<BlogSugestaoMeio atual={post(1, 'Atual')} candidato={undefined} />)
        expect(container).toBeEmptyDOMElement()
    })
})
