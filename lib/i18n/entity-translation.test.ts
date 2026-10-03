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

const { availableLocales, localizeEntity, mergeText, semTraducao } = await import('./entity-translation')
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

    it('ignora tradução desatualizada (stale)', () => {
        expect(availableLocales({ translations: { en: { title: 'Yoona', stale: true } } })).toEqual(['pt'])
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

    it('tradução desatualizada devolve a fonte em português', () => {
        const velha = { ...artist, translations: { en: { ...artist.translations.en, stale: true } } }
        expect(localizeEntity(velha, 'en', 'artist')).toBe(velha)
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

    it('traduz a analise editorial do grupo tambem no campo de topo que a ficha le', () => {
        const grupo = {
            title: { rendered: 'Grupo' },
            editorial_analysis: 'Analise em portugues',
            acf: { editorial_analysis: 'Analise em portugues' },
            translations: { en: { acf: { editorial_analysis: 'Analysis in English' } } },
        }
        const en = localizeEntity(grupo, 'en', 'group')
        expect(en.editorial_analysis).toBe('Analysis in English')
        expect(en.acf.editorial_analysis).toBe('Analysis in English')
        // sem traducao do campo, o topo segue o portugues
        const semCampo = localizeEntity({ ...grupo, translations: { en: { acf: {} } } }, 'en', 'group')
        expect(semCampo.editorial_analysis).toBe('Analise em portugues')
        // artista nao ganha campo de topo que nao tinha
        expect('editorial_analysis' in localizeEntity(artist, 'en', 'artist')).toBe(false)
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

describe('semTraducao', () => {
    const comEn = { translations: { en: { title: 'Yoona' } } }

    it('português nunca é "sem tradução"', () => {
        expect(semTraducao({ translations: null }, 'pt')).toBe(false)
    })

    it('outro idioma sem tradução publicada cai no fallback', () => {
        expect(semTraducao({ translations: null }, 'en')).toBe(true)
        expect(semTraducao({ translations: {} }, 'en')).toBe(true)
    })

    it('com tradução publicada no idioma, não é fallback', () => {
        expect(semTraducao(comEn, 'en')).toBe(false)
    })

    it('tradução desatualizada cai no fallback', () => {
        expect(semTraducao({ translations: { en: { title: 'Yoona', stale: true } } }, 'en')).toBe(true)
    })
})
