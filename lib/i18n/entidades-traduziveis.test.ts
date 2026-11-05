import { describe, expect, it } from 'vitest'
import { ENTIDADES_TRADUZIVEIS, SHARDS_TRADUZIVEIS, TIPOS_PUBLICOS, TIPOS_TRADUZIVEIS } from './entidades-traduziveis'
import { TRANSLATABLE_ACF } from './translatable-fields'
import { INDEXNOW_LOCALIZED_TYPES } from '@/lib/seo/indexnow'
import { buildSitemapIndex } from '@/lib/seo/dynamicSitemap'

describe('entidades traduzíveis', () => {
    it('todo tipo com campos traduzíveis tem entrada (e vice-versa)', () => {
        expect([...TIPOS_TRADUZIVEIS].sort()).toEqual(Object.keys(TRANSLATABLE_ACF).sort())
    })

    it('a ordem atual é preservada: artistas carregam a home do idioma no sitemap', () => {
        expect(SHARDS_TRADUZIVEIS).toEqual(['artists', 'groups', 'productions'])
        expect(ENTIDADES_TRADUZIVEIS.artist.listagem).toBe('artists')
    })

    it('tipos aceitos no WordPress mas ainda não públicos ficam fora do sitemap e do IndexNow', () => {
        expect(TIPOS_TRADUZIVEIS).toEqual(expect.arrayContaining(['agency', 'company', 'food']))
        expect(TIPOS_PUBLICOS).toEqual(['artist', 'group', 'production'])
        const indice = buildSitemapIndex()
        for (const fora of ['agencies', 'companies', 'foods']) expect(indice).not.toContain(`/sitemaps/${fora}-en.xml`)
        expect(INDEXNOW_LOCALIZED_TYPES).not.toContain('agency')
    })

    it('IndexNow e o índice de sitemap saem do mesmo registro', () => {
        expect([...INDEXNOW_LOCALIZED_TYPES]).toEqual(TIPOS_PUBLICOS)
        const indice = buildSitemapIndex()
        for (const shard of SHARDS_TRADUZIVEIS) expect(indice).toContain(`/sitemaps/${shard}-en.xml`)
    })
})
