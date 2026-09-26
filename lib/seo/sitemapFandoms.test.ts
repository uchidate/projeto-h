import { describe, expect, it, vi } from 'vitest'

const fandoms = vi.hoisted(() => ({ lista: [{ slug: 'army' }, { slug: 'blink' }] as Array<{ slug: string }> }))
vi.mock('@/lib/wordpress/fandoms', () => ({ getAllFandoms: async () => fandoms.lista }))
vi.mock('@/lib/guias', () => ({ getAllHubs: async () => [] }))

import { SITE_URL } from '@/lib/constants/site'
import { buildUrlSet, getSitemapEntries, isSitemapShard } from './dynamicSitemap'

describe('sitemap de fandoms', () => {
    it('é um shard canônico', () => { expect(isSitemapShard('fandoms')).toBe(true) })

    it('lista uma URL por torcida', async () => {
        const entradas = await getSitemapEntries('fandoms')
        expect(entradas.map(e => e.loc)).toEqual([
            `${SITE_URL}/fandoms/army`,
            `${SITE_URL}/fandoms/blink`,
        ])
        expect(() => buildUrlSet(entradas)).not.toThrow()
    })

    it('a listagem e o quiz entram nas páginas estáticas', async () => {
        const paginas = (await getSitemapEntries('pages')).map(e => e.loc)
        expect(paginas).toContain(`${SITE_URL}/fandoms`)
        expect(paginas).toContain(`${SITE_URL}/quiz`)
    })

    it('sem torcidas não publica um sitemap vazio', async () => {
        fandoms.lista = []
        await expect(getSitemapEntries('fandoms')).rejects.toThrow(/vazio/)
    })
})
