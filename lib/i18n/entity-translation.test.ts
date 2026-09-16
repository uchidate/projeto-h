import { describe, it, expect, vi } from 'vitest'

vi.mock('./config', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./config')>()
    const ACTIVE_LOCALES = ['pt', 'en'] as const
    return {
        ...actual,
        ACTIVE_LOCALES,
        isActiveLocale: (value: string) => (ACTIVE_LOCALES as readonly string[]).includes(value),
    }
})

const { availableLocales, localizeEntity, mergeText } = await import('./entity-translation')
const { buildAlternates } = await import('./alternates')

const artist = {
    title: { rendered: 'Yoona' },
    content: { rendered: '<p>Cantora e atriz.</p>' },
    excerpt: { rendered: 'Resumo' },
    meta: { rank_math_title: 'Yoona — Perfil', rank_math_description: 'Descrição PT' },
    acf: {
        birth_date: '1990-05-30',
        groups: [12],
        active: true,
        story_chapters: [
            { title: 'Estreia', description: 'Texto PT', image_url: 'https://img/1.jpg', year: 2007 },
            { title: 'Atuação', description: 'Texto PT 2', image_url: 'https://img/2.jpg', year: 2012 },
        ],
    },
    translations: {
        en: {
            content: '<p>Singer and actress.</p>',
            seo_title: 'Yoona — Profile',
            acf: {
                birth_date: 'May 30',
                story_chapters: [{ title: 'Debut', description: 'EN text', image_url: 'https://evil' }],
            },
        },
    },
}

describe('availableLocales', () => {
    it('always includes Portuguese and adds published active translations', () => {
        expect(availableLocales(artist)).toEqual(['pt', 'en'])
        expect(availableLocales({ translations: null })).toEqual(['pt'])
        expect(availableLocales({ translations: { es: {} } })).toEqual(['pt'])
    })
})

describe('localizeEntity', () => {
    it('returns the same object for Portuguese', () => {
        expect(localizeEntity(artist, 'pt', 'artist')).toBe(artist)
    })

    it('overlays translated text', () => {
        const en = localizeEntity(artist, 'en', 'artist')
        expect(en.content.rendered).toBe('<p>Singer and actress.</p>')
        expect(en.meta.rank_math_title).toBe('Yoona — Profile')
        expect(en.meta.rank_math_description).toBeUndefined()
        expect(en.acf.story_chapters[0].title).toBe('Debut')
        expect(en.acf.story_chapters[1].title).toBe('Atuação')
    })

    it('never changes non-text data or list shape', () => {
        const en = localizeEntity(artist, 'en', 'artist')
        expect(en.acf.groups).toEqual([12])
        expect(en.acf.active).toBe(true)
        expect(en.acf.story_chapters).toHaveLength(2)
        expect(en.acf.story_chapters[0].year).toBe(2007)
        // fora da lista de campos traduzíveis: data e URL da imagem continuam os do português
        expect(en.acf.birth_date).toBe('1990-05-30')
        expect(en.acf.story_chapters[0].image_url).toBe('https://img/1.jpg')
    })

    it('keeps the source when a translated string is blank', () => {
        expect(mergeText('PT', '   ')).toBe('PT')
        expect(mergeText(3, 'x')).toBe(3)
        expect(mergeText(['a'], 'x')).toEqual(['a'])
    })
})

describe('buildAlternates', () => {
    it('emits only a self canonical when there is one version', () => {
        expect(buildAlternates('artist', { slug: 'yoona' }, 'pt', ['pt'])).toEqual({
            canonical: 'https://www.example.com/artists/yoona',
        })
    })

    it('emits reciprocal hreflang with x-default on Portuguese', () => {
        const pt = buildAlternates('artist', { slug: 'yoona' }, 'pt', ['pt', 'en'])
        const en = buildAlternates('artist', { slug: 'yoona' }, 'en', ['pt', 'en'])
        expect(en.canonical).toBe('https://www.example.com/en/artists/yoona')
        expect(en.languages).toEqual(pt.languages)
        expect(pt.languages).toEqual({
            'pt-BR': 'https://www.example.com/artists/yoona',
            en: 'https://www.example.com/en/artists/yoona',
            'x-default': 'https://www.example.com/artists/yoona',
        })
    })
})
