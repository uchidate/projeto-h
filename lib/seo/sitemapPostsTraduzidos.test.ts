import { describe, expect, it, vi } from 'vitest'

const wp = vi.hoisted(() => ({ items: [] as Array<Record<string, unknown>> }))
vi.mock('@/lib/wordpress/client', () => ({
    buildParams: (p: Record<string, unknown>) => '?' + new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString(),
    wpFetchWithTotal: async (path: string) => {
        expect(path).toContain('lang=en')
        return { items: wp.items, total: wp.items.length, totalPages: 1 }
    },
}))
vi.mock('@/lib/guias', () => ({ getAllHubs: async () => [] }))
vi.mock('@/lib/wordpress/fandoms', () => ({ getAllFandoms: async () => [] }))

import { SITE_URL } from '@/lib/constants/site'
import { getLocalizedSitemapEntries, localesComPostsTraduzidos, buildUrlSet } from './dynamicSitemap'

describe('sitemap de posts traduzidos', () => {
    it('sem artigo traduzido: vazio, sem lançar', async () => {
        wp.items = []
        expect(await getLocalizedSitemapEntries('posts', 'en')).toEqual([])
        expect(await localesComPostsTraduzidos()).toEqual([])
    })

    it('lista a listagem e cada artigo com hreflang recíproco', async () => {
        wp.items = [{ slug: 'my-post', modified: '2026-10-05T10:00:00', translations: { pt: 'meu-post', en: 'my-post' } }]
        const entradas = await getLocalizedSitemapEntries('posts', 'en')
        expect(entradas.map((e) => e.loc)).toEqual([`${SITE_URL}/en/blog`, `${SITE_URL}/en/blog/my-post`])
        expect(entradas[1].alternates).toEqual({
            'pt-BR': `${SITE_URL}/blog/meu-post`,
            en: `${SITE_URL}/en/blog/my-post`,
            'x-default': `${SITE_URL}/blog/meu-post`,
        })
        expect(entradas[1].lastmod).toBe('2026-10-05')
        expect(() => buildUrlSet(entradas)).not.toThrow()
        return localesComPostsTraduzidos().then((l) => expect(l).toEqual(['en']))
    })
})
