import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/i18n/config', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/i18n/config')>()
    return { ...actual, ACTIVE_LOCALES: ['pt', 'en'] }
})

const { buildLocalizedIndexNowUrls } = await import('./indexnow')

describe('buildLocalizedIndexNowUrls com inglês ativo', () => {
    it('submete só os idiomas com tradução publicada', () => {
        expect(buildLocalizedIndexNowUrls('production', 'o-retorno-do-juiz', ['en']))
            .toEqual(['https://www.example.com/en/productions/o-retorno-do-juiz'])
        expect(buildLocalizedIndexNowUrls('group', 'kard', [])).toEqual([])
        expect(buildLocalizedIndexNowUrls('artist', 'yoona', ['pt', 'es'])).toEqual([])
    })
})
