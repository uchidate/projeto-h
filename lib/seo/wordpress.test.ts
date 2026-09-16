import { describe, it, expect } from 'vitest'
import { buildWordPressMetadata } from './wordpress'

const BASE = {
    title: 'Jimin — Perfil',
    description: 'Tudo sobre o Jimin',
    url: 'https://example.com/artists/jimin',
}

describe('buildWordPressMetadata', () => {
    it('declara og:locale:alternate com as outras versoes do hreflang', () => {
        const meta = buildWordPressMetadata({
            ...BASE,
            ogLocale: 'en_US',
            languages: { 'pt-BR': 'https://example.com/artists/jimin', en: 'https://example.com/en/artists/jimin', 'x-default': 'https://example.com/artists/jimin' },
        })
        expect((meta.openGraph as { locale?: string }).locale).toBe('en_US')
        expect((meta.openGraph as { alternateLocale?: string[] }).alternateLocale).toEqual(['pt_BR'])
    })

    it('sem hreflang, nao declara og:locale:alternate', () => {
        const meta = buildWordPressMetadata(BASE)
        expect((meta.openGraph as { alternateLocale?: string[] }).alternateLocale).toBeUndefined()
    })

    it('usa title/description/url do frontend quando não há seo do WP', () => {
        const meta = buildWordPressMetadata(BASE)
        expect(meta.title).toBe('Jimin — Perfil')
        expect(meta.description).toBe('Tudo sobre o Jimin')
        expect(meta.alternates?.canonical).toBe('https://example.com/artists/jimin')
    })

    it('seo.title/description/canonical do WP têm prioridade sobre os do frontend', () => {
        const meta = buildWordPressMetadata({
            ...BASE,
            seo: { title: 'Jimin (BTS) — Portal', description: 'Descrição editorial', canonical: 'https://example.com/artists/jimin-canonical' },
        })
        expect(meta.description).toBe('Descrição editorial')
        expect(meta.alternates?.canonical).toBe('https://example.com/artists/jimin-canonical')
    })

    it('título editorial que já inclui o nome do site vira {absolute} (não recebe o template global de novo)', () => {
        const meta = buildWordPressMetadata({
            ...BASE,
            seo: { title: 'Jimin (BTS) | Portal' },
        })
        expect(meta.title).toEqual({ absolute: 'Jimin (BTS) | Portal' })
    })

    it('título editorial que NÃO inclui o nome do site fica como string simples (recebe o template global)', () => {
        const meta = buildWordPressMetadata({
            ...BASE,
            seo: { title: 'Jimin (BTS) — biografia completa' },
        })
        expect(meta.title).toBe('Jimin (BTS) — biografia completa')
    })

    it('prioridade de imagem: seo.og_image > ogImageOverride > image prop', () => {
        const withSeoImage = buildWordPressMetadata({
            ...BASE,
            image: { src: '/local.jpg', alt: 'local' },
            ogImageOverride: 'https://example.com/override.jpg',
            seo: { og_image: [{ url: 'https://example.com/wp-image.jpg', width: 1200, height: 630 }] },
        })
        expect(withSeoImage.openGraph?.images).toEqual([{ url: 'https://example.com/wp-image.jpg', width: 1200, height: 630 }])

        const withOverrideOnly = buildWordPressMetadata({
            ...BASE,
            image: { src: '/local.jpg', alt: 'local' },
            ogImageOverride: 'https://example.com/override.jpg',
        })
        expect(withOverrideOnly.openGraph?.images).toEqual([{ url: 'https://example.com/override.jpg', width: 1200, height: 630 }])

        const withImageOnly = buildWordPressMetadata({
            ...BASE,
            image: { src: '/local.jpg', alt: 'texto alternativo' },
        })
        expect(withImageOnly.openGraph?.images).toEqual([{ url: '/local.jpg', alt: 'texto alternativo' }])
    })

    it('sem nenhuma imagem específica, usa o OG_IMAGE default do site (via baseOG)', () => {
        const meta = buildWordPressMetadata(BASE)
        expect(meta.openGraph?.images).toEqual([{ url: 'https://www.example.com/opengraph-image', width: 1200, height: 630 }])
    })

    it('mapeia seo.robots pra noindex/nofollow do Next.js', () => {
        const meta = buildWordPressMetadata({ ...BASE, seo: { robots: { noindex: 'noindex', nofollow: '' } } })
        expect(meta.robots).toEqual({ index: false, follow: true })
    })

    it('sem seo.robots, não define robots (deixa o default do Next.js)', () => {
        const meta = buildWordPressMetadata(BASE)
        expect(meta.robots).toBeUndefined()
    })

    it('article adiciona type/publishedTime/modifiedTime ao openGraph', () => {
        const meta = buildWordPressMetadata({
            ...BASE,
            article: { publishedTime: '2026-01-01T00:00:00Z', modifiedTime: '2026-02-01T00:00:00Z' },
        })
        expect(meta.openGraph).toMatchObject({
            type: 'article',
            publishedTime: '2026-01-01T00:00:00Z',
            modifiedTime: '2026-02-01T00:00:00Z',
        })
    })

    it('sem article, openGraph.type usa o default de baseOG (website)', () => {
        const meta = buildWordPressMetadata(BASE)
        expect(meta.openGraph).toMatchObject({ type: 'website' })
    })

    it('og_title/og_description do WP têm prioridade sobre title/description resolvidos', () => {
        const meta = buildWordPressMetadata({
            ...BASE,
            seo: { og_title: 'Título específico pro OG', og_description: 'Descrição específica pro OG' },
        })
        expect(meta.openGraph?.title).toBe('Título específico pro OG')
        expect(meta.openGraph?.description).toBe('Descrição específica pro OG')
        expect(meta.twitter?.title).toBe('Título específico pro OG')
    })
})
