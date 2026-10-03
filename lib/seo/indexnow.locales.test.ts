import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/i18n/config', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/i18n/config')>()
    return { ...actual, ACTIVE_LOCALES: ['pt', 'en'] }
})

const { buildLocalizedIndexNowUrls, buildPurgeUrls } = await import('./indexnow')

describe('buildLocalizedIndexNowUrls com inglês ativo', () => {
    it('submete só os idiomas com tradução publicada', () => {
        expect(buildLocalizedIndexNowUrls('production', 'o-retorno-do-juiz', ['en']))
            .toEqual(['https://www.example.com/en/productions/o-retorno-do-juiz'])
        expect(buildLocalizedIndexNowUrls('group', 'kard', [])).toEqual([])
        expect(buildLocalizedIndexNowUrls('artist', 'yoona', ['pt', 'es'])).toEqual([])
    })
})

describe('buildPurgeUrls com inglês ativo', () => {
    it('expurga a versão em inglês mesmo sem tradução publicada (a ficha de fallback é servida)', () => {
        expect(buildPurgeUrls('artist', 'yoona')).toEqual([
            'https://www.example.com/artists/yoona',
            'https://www.example.com/en/artists/yoona',
        ])
    })

    it('tipos sem versão em outro idioma expurgam só a original', () => {
        expect(buildPurgeUrls('post', 'guia-do-kpop')).toEqual(['https://www.example.com/blog/guia-do-kpop'])
    })
})
