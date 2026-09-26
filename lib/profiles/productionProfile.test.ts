import { describe, expect, it } from 'vitest'
import type { WPProduction } from '@/lib/wordpress/types'
import { buildProductionProfileModel, sinopseResumo } from './productionProfile'

function production(overrides: Partial<WPProduction> = {}): WPProduction {
    return {
        id: 1, slug: 'drama', status: 'publish', date: '2020-01-01', modified: '2020-01-01',
        title: { rendered: 'Meu &amp; Drama' }, content: { rendered: '<p>Sinopse longa.</p>' },
        excerpt: { rendered: '<p>Resumo editorial.</p>' }, featured_media: 0,
        ...overrides,
    }
}

describe('buildProductionProfileModel', () => {
    it('normaliza apresentação, termos e campos derivados', () => {
        const model = buildProductionProfileModel(production({
            acf: {
                type: 'drama', year: 2024, status_production: 'completed',
                gallery_urls: ['https://img.test/1.jpg'], curiosidades: ['Fato'],
                trailer_url: 'https://youtube.com/watch?v=abcdefghijk',
            },
            _embedded: { 'wp:term': [[
                { id: 2, name: 'Romance', slug: 'romance', taxonomy: 'production_genre', count: 1 },
                { id: 3, name: 'Netflix', slug: 'netflix', taxonomy: 'production_platform', count: 1 },
            ]] },
            production_cast: [{ slug: 'atriz', role: 'Protagonista' }],
        }))

        expect(model.title).toBe('Meu & Drama')
        expect(model.displayType).toBe('Série')
        expect(model.schemaType).toBe('TVSeries')
        expect(model.genres.map(term => term.slug)).toEqual(['romance'])
        expect(model.primaryPlatform).toBe('Netflix')
        expect(model.backdropUrl).toBe('https://img.test/1.jpg')
        expect(model.hasTrailer).toBe(true)
        expect(model.castRoles.get('atriz')).toBe('Protagonista')
        expect(model.statusInfo?.label).toBe('Concluído')
    })

    it('aplica defaults seguros e rejeita trailer inválido', () => {
        const model = buildProductionProfileModel(production({ acf: { trailer_url: 'não-é-youtube' } }))

        expect(model.hasTrailer).toBe(false)
        expect(model.genres).toEqual([])
        expect(model.platforms).toEqual([])
        expect(model.galleryUrls).toEqual([])
        expect(model.facts).toEqual([])
        expect(model.releaseLabel).toBeNull()
        expect(model.schemaType).toBe('TVSeries')
    })

    it('usa Movie no schema e backdrop explícito antes da galeria', () => {
        const model = buildProductionProfileModel(production({
            acf: { type: 'movie', backdrop_url: 'https://img.test/backdrop.jpg', gallery_urls: ['https://img.test/gallery.jpg'] },
        }))
        expect(model.schemaType).toBe('Movie')
        expect(model.backdropUrl).toBe('https://img.test/backdrop.jpg')
    })
})


describe('sinopseResumo', () => {
    const ficha = '<p>Tudo Bem Não Ser Normal (2020) é uma série sul-coreana de 16 episódios, de cerca de 77 minutos cada.</p>'
    const sinopse = '<p>O encontro entre uma escritora de livros infantis e um cuidador de doentes mentais dá início a uma jornada de superação dos problemas emocionais que ambos enfrentam.</p>'
    const elenco = '<p>No elenco: Kim Soo-hyun (como Moon Gang-tae), Seo Yea-ji (como Ko Moon-young), Oh Jung-se e muitos outros atores do elenco principal.</p>'

    it('pula a linha de ficha e devolve a sinopse real', () => {
        expect(sinopseResumo(ficha + '<p></p>' + sinopse + elenco)).toMatch(/^O encontro entre uma escritora/)
    })

    it('nunca devolve o parágrafo de elenco', () => {
        expect(sinopseResumo(ficha + elenco)).toBe('')
    })

    it('sem sinopse aproveitável devolve vazio, não texto genérico', () => {
        expect(sinopseResumo('<p>curto</p>')).toBe('')
        expect(sinopseResumo('')).toBe('')
    })

    it('limita o tamanho para caber no resumo', () => {
        const longa = `<p>${'palavra '.repeat(200)}</p>`
        expect(sinopseResumo(longa).length).toBeLessThanOrEqual(420)
    })
})
