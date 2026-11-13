import { describe, expect, it } from 'vitest'
import { availableLocales, indexableLocales } from '@/lib/i18n/entity-translation'
import { LOCALE_META } from '@/lib/i18n/config'
import { alternatesDaFicha, buildSitemapIndex, buildUrlSet, isSitemapShard, resolveLocalizedShard, resolveSitemapShard, sitemapResponse } from './dynamicSitemap'

describe('sitemap dinâmico', () => {
    it('publica todos os shards canônicos no índice', () => {
        const xml = buildSitemapIndex()
        expect(xml).toContain('/sitemaps/pages.xml')
        expect(xml).toContain('/sitemaps/posts.xml')
        expect(xml).toContain('/sitemaps/companies.xml')
        expect(xml).toContain('/sitemaps/fandoms.xml')
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
        expect(resolveLocalizedShard('artists-fr')).toBeNull()
        expect(resolveLocalizedShard('posts-en')).toEqual({ shard: 'posts', locale: 'en' })
        expect(resolveLocalizedShard('posts-pt')).toBeNull()
        expect(resolveLocalizedShard('agencies-en')).toEqual({ shard: 'agencies', locale: 'en' })
        expect(resolveLocalizedShard('fandoms-en')).toBeNull()
        expect(buildSitemapIndex()).toContain('-en.xml')
    })

    it('posts traduzidos só entram no índice quando o idioma tem artigo publicado', () => {
        expect(buildSitemapIndex()).not.toContain('posts-en.xml')
        expect(buildSitemapIndex(['en'])).toContain('/sitemaps/posts-en.xml')
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

    it('alternates da ficha repetem o conjunto completo e ignoram tradução velha', () => {
        const alt = alternatesDaFicha('company', { slug: 'x', translations: { en: { stale: false }, es: { stale: true } } })
        expect(Object.keys(alt ?? {})).toEqual(['pt-BR', 'en', 'x-default'])
        expect(alternatesDaFicha('company', { slug: 'x', translations: null })).toBeUndefined()
    })

    it('sitemap e página decidem os idiomas pela mesma função (availableLocales)', () => {
        const translations = { en: { stale: false }, es: null, fr: { stale: false } }
        const alt = alternatesDaFicha('artist', { slug: 'iu', translations })
        const htmlLangs = availableLocales({ translations }).map((l) => LOCALE_META[l].htmlLang)
        expect(Object.keys(alt ?? {}).filter((k) => k !== 'x-default')).toEqual(htmlLangs)
    })

    it('ficha de artista fina (noindex na página) sai do hreflang e do sitemap do idioma', () => {
        const fina = 'Texto curto.<div class="hh-secao"><h2>x</h2><p>' + 'a'.repeat(500) + '</p></div>'
        const longa = 'b'.repeat(400)
        const translations = { en: { stale: false, content: fina }, es: { stale: false, content: longa } }
        expect(indexableLocales({ translations }, 'artist')).toEqual(['pt', 'es'])
        expect(Object.keys(alternatesDaFicha('artist', { slug: 'x', translations }) ?? {})).toEqual(['pt-BR', 'es', 'x-default'])
        // outros tipos seguem a regra de availableLocales
        expect(indexableLocales({ translations }, 'company')).toEqual(['pt', 'en', 'es'])
        // texto traduzido vazio cai no português na página: não é ficha fina
        expect(indexableLocales({ translations: { en: { stale: false, content: '' } } }, 'artist')).toEqual(['pt', 'en'])
    })
})
