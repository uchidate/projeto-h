import { describe, it, expect } from 'vitest'
import { ACTIVE_LOCALES, isActiveLocale, isLocale, splitLocale } from './config'
import { href } from './routes'
import { formatDate, formatNumber } from './format'

describe('config', () => {
    it('has English active since the 2026-09-15 pilot, with Portuguese as default', () => {
        expect(ACTIVE_LOCALES).toEqual(['pt', 'en'])
        expect(isLocale('en')).toBe(true)
        expect(isActiveLocale('en')).toBe(true)
        expect(isActiveLocale('es')).toBe(false)
    })

    it('splits the locale prefix from the path', () => {
        expect(splitLocale('/en/artists/yoona')).toEqual({ locale: 'en', path: '/artists/yoona' })
        expect(splitLocale('/en')).toEqual({ locale: 'en', path: '/' })
        expect(splitLocale('/artists/yoona')).toEqual({ locale: 'pt', path: '/artists/yoona' })
    })

    it('does not mistake a two-letter segment for a locale', () => {
        expect(splitLocale('/es/x')).toEqual({ locale: 'pt', path: '/es/x' })
        expect(splitLocale('/english')).toEqual({ locale: 'pt', path: '/english' })
    })

    it('treats an explicit /pt prefix as a path, not a locale', () => {
        expect(splitLocale('/pt/artists')).toEqual({ locale: 'pt', path: '/pt/artists' })
    })
})

describe('href', () => {
    it('keeps Portuguese URLs unprefixed', () => {
        expect(href('home')).toBe('/')
        expect(href('artist', { slug: 'yoona' })).toBe('/artists/yoona')
    })

    it('prefixes other locales', () => {
        expect(href('home', undefined, 'en')).toBe('/en')
        expect(href('production', { slug: 'o-retorno-do-juiz' }, 'en')).toBe('/en/productions/o-retorno-do-juiz')
    })

    it('encodes slugs', () => {
        expect(href('group', { slug: 'a b' })).toBe('/groups/a%20b')
    })
})

describe('format', () => {
    it('formats per locale', () => {
        const date = '2026-09-13T12:00:00Z'
        expect(formatDate(date, { month: 'long', timeZone: 'UTC' })).toBe('setembro')
        expect(formatDate(date, { month: 'long', timeZone: 'UTC' }, 'en')).toBe('September')
        expect(formatNumber(1234.5)).toBe('1.234,5')
        expect(formatNumber(1234.5, undefined, 'en')).toBe('1,234.5')
    })
})

describe('messages', () => {
    it('loads the same namespaces for every locale', async () => {
        const { loadMessages } = await import('./messages')
        const pt = await loadMessages('pt')
        const en = await loadMessages('en')
        const keys = (o: object): string[] =>
            Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v).map((s) => `${k}.${s}`) : [k]))
        expect(keys(en).sort()).toEqual(keys(pt).sort())
        expect(en.entity.breadcrumb.productions).toBe("Productions")
    })
})
