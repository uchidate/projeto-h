import { describe, expect, it } from 'vitest'
import { ACTIVE_LOCALES, DEFAULT_LOCALE, LOCALE_META, isActiveLocale, isLocale, splitLocale } from './config'
import { LOCALES } from './idiomas.mjs'
import { dataRelativa } from '@/lib/home/data-relativa'
import { href } from './routes'
import { labelsFor } from './labels'
import { loadMessages } from './messages'
import { rewritesDasRotasMigradas } from './rotas-migradas.mjs'
import { idiomaValido } from './pagina'

/**
 * Prova de que um idioma novo cabe no código sem tocar nas páginas (F7): `es` existe em `LOCALES`, está
 * DESLIGADO em `ACTIVE_LOCALES` (responde 404) e tudo o que um idioma precisa já tem uma resposta.
 * Ao ativar o espanhol, estes testes continuam valendo; só o primeiro muda. Ver docs/I18N-NOVO-IDIOMA.md.
 */
describe('idioma novo (es) construído e desligado', () => {
    it('existe no código e está ativo (ligado em 2026-11-08)', () => {
        expect(LOCALES).toContain('es')
        expect(isLocale('es')).toBe(true)
        expect(ACTIVE_LOCALES).toContain('es')
        expect(isActiveLocale('es')).toBe(true)
        expect(idiomaValido('es')).toBe(true)
    })

    it('todo idioma conhecido tem metadados de html/og/Intl', () => {
        for (const l of LOCALES) expect(LOCALE_META[l].htmlLang, l).toBeTruthy()
    })

    it('o prefixo /es é reconhecido como idioma', () => {
        expect(splitLocale('/es/artists')).toEqual({ locale: 'es', path: '/artists' })
    })

    it('rotas herdam o caminho do inglês quando não há um próprio', () => {
        expect(href('artists', undefined, 'es')).toBe('/es/artists')
        expect(href('artist', { slug: 'iu' }, 'es')).toBe('/es/artists/iu')
        expect(href('home', undefined, 'es')).toBe('/es')
        expect(href('companies', undefined, 'es')).toBe('/es/companies')
    })

    it('rótulos de dados existem em espanhol', () => {
        const l = labelsFor('es')
        expect(l.role('actor', 'female')).toBe('Actriz')
        expect(l.groupType('girl_group')).toBe('Grupo femenino')
        expect(l.generation(4)).toBe('4.ª generación')
    })

    it('datas relativas têm as palavras do idioma', () => {
        expect(dataRelativa(new Date().toISOString(), 'es')).toBe('hoy')
    })

    it('o espanhol tem catálogo próprio, com as mesmas chaves do português', async () => {
        const chaves = (o: unknown, p = ''): string[] =>
            o && typeof o === 'object' && !Array.isArray(o)
                ? Object.entries(o).flatMap(([k, v]) => chaves(v, `${p}${k}.`))
                : [p]
        const es = await loadMessages('es')
        expect(chaves(es)).toEqual(chaves(await loadMessages('pt')))
        expect(es.client.nav.shop).toBe('Tienda')
    })

    it('listagens com filtro também desviam em /es (herdam as chaves do inglês)', () => {
        const desvios = rewritesDasRotasMigradas().filter((r) => 'has' in r && r.source.startsWith('/es/'))
        expect(desvios.length).toBeGreaterThan(0)
        expect(desvios.every((r) => r.destination.startsWith('/es/'))).toBe(true)
    })

    it('o português continua sendo o padrão, sem prefixo', () => {
        expect(DEFAULT_LOCALE).toBe('pt')
        expect(href('artists')).toBe('/artists')
    })
})

/**
 * Japonês (quarto idioma): construído e DESLIGADO. Só `home` e `entity.home` têm tradução própria; o resto da
 * interface vem do inglês até cada namespace ganhar arquivo (docs/I18N-NOVO-IDIOMA.md).
 */
describe('idioma novo (ja) construído e desligado', () => {
    it('existe no código, mas não está ativo (responde 404)', () => {
        expect(LOCALES).toContain('ja')
        expect(isLocale('ja')).toBe(true)
        expect(ACTIVE_LOCALES).not.toContain('ja')
        expect(isActiveLocale('ja')).toBe(false)
        expect(idiomaValido('ja')).toBe(false)
    })

    it('tem metadados, caminho herdado do inglês, rótulos e datas', () => {
        expect(LOCALE_META.ja).toEqual({ htmlLang: 'ja', ogLocale: 'ja_JP', intl: 'ja' })
        expect(splitLocale('/ja/artists')).toEqual({ locale: 'ja', path: '/artists' })
        expect(href('home', undefined, 'ja')).toBe('/ja')
        expect(href('artist', { slug: 'iu' }, 'ja')).toBe('/ja/artists/iu')
        const l = labelsFor('ja')
        expect(l.role('actor', 'female')).toBe('女優')
        expect(l.generation(4)).toBe('第4世代')
        expect(dataRelativa(new Date().toISOString(), 'ja')).toBe('今日')
    })

    it('o catálogo japonês tem as mesmas chaves do inglês; só a home é japonesa, o resto cai no inglês', async () => {
        const chaves = (o: unknown, p = ''): string[] =>
            o && typeof o === 'object' && !Array.isArray(o)
                ? Object.entries(o).flatMap(([k, v]) => chaves(v, `${p}${k}.`))
                : [p]
        const ja = await loadMessages('ja')
        const en = await loadMessages('en')
        expect(chaves(ja)).toEqual(chaves(en))
        expect(ja.home.hero.lerAgora).toBe('今すぐ読む')
        expect(ja.entity.home.title).toContain('K-POP')
        expect(ja.client.nav.shop).toBe(en.client.nav.shop)
    })
})
