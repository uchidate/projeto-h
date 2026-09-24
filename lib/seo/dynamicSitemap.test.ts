import { describe, expect, it } from 'vitest'
import { buildSitemapIndex, buildUrlSet, isSitemapShard, resolveLocalizedShard, resolveSitemapShard, sitemapResponse } from './dynamicSitemap'

describe('sitemap dinâmico', () => {
    it('publica todos os shards canônicos no índice', () => {
        const xml = buildSitemapIndex()
        expect(xml).toContain('/sitemaps/pages.xml')
        expect(xml).toContain('/sitemaps/posts.xml')
        expect(xml).toContain('/sitemaps/companies.xml')
        expect(xml).not.toContain('companys.xml')
        expect(xml).not.toContain('agencys.xml')
    })

    it('serializa URL e lastmod com escape XML', () => {
        const xml = buildUrlSet([{ loc: 'https://www.example.com/blog/a&b', lastmod: '2026-07-17' }])
        expect(xml).toContain('/blog/a&amp;b')
        expect(xml).toContain('<lastmod>2026-07-17</lastmod>')
    })

    it('rejeita shards desconhecidos', () => {
        expect(isSitemapShard('artists')).toBe(true)
        expect(isSitemapShard('unknown')).toBe(false)
        expect(resolveSitemapShard('agencys')).toBe('agencies')
        expect(resolveSitemapShard('companys')).toBe('companies')
    })

    it('rejeita URLs duplicadas', () => {
        expect(() => buildUrlSet([{ loc: 'https://www.example.com/a' }, { loc: 'https://www.example.com/a' }]))
            .toThrow('duplicadas')
    })

    it('só expõe shards por idioma para idiomas ativos e tipos traduzíveis', () => {
        expect(resolveLocalizedShard('artists-en')).not.toBeNull()
        expect(resolveLocalizedShard('artists-pt')).toBeNull()
        expect(resolveLocalizedShard('artists-es')).toBeNull()
        expect(resolveLocalizedShard('posts-en')).toBeNull()
        expect(buildSitemapIndex()).toContain('-en.xml')
    })

    it('serializa hreflang alternativo com o namespace xhtml', () => {
        const xml = buildUrlSet([{
            loc: 'https://www.example.com/en/artists/yoona',
            alternates: { 'pt-BR': 'https://www.example.com/artists/yoona', en: 'https://www.example.com/en/artists/yoona' },
        }])
        expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
        expect(xml).toContain('<xhtml:link rel="alternate" hreflang="pt-BR" href="https://www.example.com/artists/yoona"/>')
        expect(buildUrlSet([{ loc: 'https://www.example.com/a' }])).not.toContain('xmlns:xhtml')
    })
})

describe('sitemapResponse', () => {
    it('cacheia por 1h na borda, com 24h de tolerância, e serve XML', () => {
        const r = sitemapResponse('<urlset/>')
        expect(r.headers.get('Cache-Control')).toBe('public, s-maxage=3600, stale-while-revalidate=86400')
        expect(r.headers.get('Content-Type')).toContain('application/xml')
    })
})
