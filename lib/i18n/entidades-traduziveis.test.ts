import { describe, expect, it } from 'vitest'
import { ENTIDADES_TRADUZIVEIS, SHARDS_TRADUZIVEIS, TIPOS_PUBLICOS, TIPOS_TRADUZIVEIS, caminhoDaFicha, caminhoDaListagem } from './entidades-traduziveis'
import { TRANSLATABLE_ACF } from './translatable-fields'
import { INDEXNOW_LOCALIZED_TYPES } from '@/lib/seo/indexnow'
import { buildSitemapIndex } from '@/lib/seo/dynamicSitemap'

describe('entidades traduzíveis', () => {
    it('todo tipo com campos traduzíveis tem entrada (e vice-versa)', () => {
        expect([...TIPOS_TRADUZIVEIS].sort()).toEqual(Object.keys(TRANSLATABLE_ACF).sort())
    })

    it('a ordem é preservada: artistas carregam a home do idioma no sitemap', () => {
        expect(SHARDS_TRADUZIVEIS).toEqual(['artists', 'groups', 'productions', 'agencies', 'companies', 'foods'])
        expect(ENTIDADES_TRADUZIVEIS.artist.listagem).toBe('artists')
    })

    it('todo tipo traduzível é público (a página lê a tradução e a interface está traduzida)', () => {
        expect(TIPOS_PUBLICOS).toEqual(TIPOS_TRADUZIVEIS)
    })

    it('o caminho em outro idioma sai do registro de rotas, não do português com prefixo', () => {
        expect(caminhoDaFicha('food', 'gochujang', 'pt')).toBe('/comidas/gochujang')
        expect(caminhoDaFicha('food', 'gochujang', 'en')).toBe('/en/foods/gochujang')
        expect(caminhoDaFicha('company', 'cj-enm', 'en')).toBe('/en/companies/cj-enm')
        expect(caminhoDaFicha('artist', 'iu', 'en')).toBe('/en/artists/iu')
        expect(caminhoDaListagem('company', 'en')).toBe('/en/companies')
        expect(caminhoDaListagem('food', 'pt')).toBe('/comidas')
    })

    it('o índice lista só os shards que o idioma tem, quando informados', () => {
        const indice = buildSitemapIndex([], { en: ['artists', 'foods'] })
        expect(indice).toContain('/sitemaps/artists-en.xml')
        expect(indice).toContain('/sitemaps/foods-en.xml')
        expect(indice).not.toContain('/sitemaps/agencies-en.xml')
    })

    it('IndexNow e o índice de sitemap saem do mesmo registro', () => {
        expect([...INDEXNOW_LOCALIZED_TYPES]).toEqual(TIPOS_PUBLICOS)
        const indice = buildSitemapIndex()
        for (const shard of SHARDS_TRADUZIVEIS) expect(indice).toContain(`/sitemaps/${shard}-en.xml`)
    })
})
