import { describe, it, expect } from 'vitest'
import { buildArticleSchema, buildBreadcrumbSchema } from './jsonld'

describe('buildBreadcrumbSchema', () => {
    it('builds a BreadcrumbList with 1-indexed positions', () => {
        const schema = buildBreadcrumbSchema([
            { name: 'Portal', url: 'https://x/' },
            { name: 'Artistas', url: 'https://x/artists' },
            { name: 'Jimin', url: 'https://x/artists/jimin' },
        ])
        expect(schema['@type']).toBe('BreadcrumbList')
        expect(schema.itemListElement).toHaveLength(3)
        expect(schema.itemListElement[0].position).toBe(1)
        expect(schema.itemListElement[2].position).toBe(3)
        expect(schema.itemListElement[2].name).toBe('Jimin')
    })

    it('returns an empty list for no items', () => {
        expect(buildBreadcrumbSchema([]).itemListElement).toHaveLength(0)
    })
})

describe('buildArticleSchema', () => {
    const base = {
        type: 'NewsArticle' as const,
        headline: 'Título',
        description: 'Resumo',
        url: 'https://x/blog/noticia',
        datePublished: '2026-07-15T10:00:00Z',
        dateModified: '2026-07-15T11:00:00Z',
        author: { type: 'Person' as const, name: 'Autora' },
        publisher: { name: 'Portal', url: 'https://x' },
    }

    it('gera NewsArticle ligado à URL canônica e ao publisher', () => {
        const schema = buildArticleSchema({ ...base, image: 'https://x/image.jpg', articleSection: 'Notícias' })

        expect(schema).toMatchObject({
            '@type': 'NewsArticle',
            mainEntityOfPage: { '@id': base.url },
            author: { '@type': 'Person', name: 'Autora' },
            publisher: { '@type': 'Organization', name: 'Portal', url: 'https://x' },
            image: { '@type': 'ImageObject', url: 'https://x/image.jpg' },
            articleSection: 'Notícias',
        })
    })

    it('usa URL no autor Organization e omite opcionais ausentes', () => {
        const schema = buildArticleSchema({
            ...base,
            type: 'BlogPosting',
            author: { type: 'Organization', name: 'Portal', url: 'https://x' },
        })

        expect(schema['@type']).toBe('BlogPosting')
        expect(schema.author).toEqual({ '@type': 'Organization', name: 'Portal', url: 'https://x' })
        expect(schema).not.toHaveProperty('image')
        expect(schema).not.toHaveProperty('articleSection')
    })
})
