import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { seoToMetadata, fetchPageSEO, type UnifiedSEOData } from './unified-seo'

describe('seoToMetadata', () => {
    it('retorna o fallback quando seo é null', () => {
        const fallback = { title: 'Fallback' }
        expect(seoToMetadata(null, fallback)).toBe(fallback)
    })

    it('retorna objeto vazio quando seo é null e não há fallback', () => {
        expect(seoToMetadata(null)).toEqual({})
    })

    it('retorna o fallback quando seo existe mas não tem metaTags', () => {
        const fallback = { title: 'Fallback' }
        expect(seoToMetadata({ type: 'artist', slug: 'jimin' }, fallback)).toBe(fallback)
    })

    it('mapeia metaTags pro formato Metadata do Next.js', () => {
        const seo: UnifiedSEOData = {
            type: 'artist',
            slug: 'jimin',
            metaTags: {
                title: 'Jimin — Portal',
                description: 'Perfil do Jimin',
                image: 'https://example.com/jimin.jpg',
                ogType: 'profile',
                canonical: 'https://example.com/artists/jimin',
            },
        }
        const result = seoToMetadata(seo)
        expect(result.title).toBe('Jimin — Portal')
        expect(result.description).toBe('Perfil do Jimin')
        expect(result.alternates?.canonical).toBe('https://example.com/artists/jimin')
    })

    it('ogType "article" vira openGraph.type "article", qualquer outro valor vira "website"', () => {
        const base: UnifiedSEOData['metaTags'] = {
            title: 't', description: 'd', image: 'i', canonical: 'c', ogType: 'article',
        }
        expect(seoToMetadata({ type: 'post', slug: 'x', metaTags: base }).openGraph).toMatchObject({ type: 'article' })
        expect(seoToMetadata({ type: 'post', slug: 'x', metaTags: { ...base, ogType: 'profile' } }).openGraph).toMatchObject({ type: 'website' })
    })

    it('passa hreflangs pro alternates.languages', () => {
        const seo: UnifiedSEOData = {
            type: 'artist', slug: 'jimin',
            metaTags: { title: 't', description: 'd', image: 'i', ogType: 'profile', canonical: 'c' },
            hreflangs: { 'pt-BR': 'https://x.com/pt', 'en-US': 'https://x.com/en' },
        }
        expect(seoToMetadata(seo).alternates?.languages).toEqual({ 'pt-BR': 'https://x.com/pt', 'en-US': 'https://x.com/en' })
    })

    it('twitter card é sempre summary_large_image com a mesma imagem do OG', () => {
        const seo: UnifiedSEOData = {
            type: 'artist', slug: 'jimin',
            metaTags: { title: 't', description: 'd', image: 'https://x.com/img.jpg', ogType: 'profile', canonical: 'c' },
        }
        expect(seoToMetadata(seo).twitter).toEqual({ card: 'summary_large_image', images: ['https://x.com/img.jpg'] })
    })
})

describe('fetchPageSEO', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        consoleErrorSpy.mockRestore()
    })

    it('retorna os dados de SEO quando a API responde ok', async () => {
        const data = { type: 'artist', slug: 'jimin', metaTags: { title: 't', description: 'd', image: 'i', ogType: 'profile', canonical: 'c' } }
        fetchMock.mockResolvedValue({ ok: true, json: async () => data })
        const result = await fetchPageSEO('artist', 'jimin', '/artists/jimin')
        expect(result).toEqual(data)
    })

    it('monta a URL com type/slug/pathname como query params', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
        await fetchPageSEO('production', 'stars-falling', '/productions/stars-falling')
        const [url] = fetchMock.mock.calls[0]
        expect(url).toContain('type=production')
        expect(url).toContain('slug=stars-falling')
        expect(url).toContain('pathname=%2Fproductions%2Fstars-falling')
    })

    it('retorna null quando a resposta não é ok', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 404 })
        expect(await fetchPageSEO('artist', 'inexistente', '/artists/inexistente')).toBeNull()
    })

    it('retorna null e loga erro quando o fetch rejeita', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await fetchPageSEO('artist', 'jimin', '/artists/jimin')).toBeNull()
        expect(consoleErrorSpy).toHaveBeenCalled()
    })
})
