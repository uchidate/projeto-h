import { describe, expect, it } from 'vitest'
import { ACTIVE_LOCALES, LOCALE_META } from './config'
import { buildAlternatesAtivos } from './alternates'

describe('buildAlternatesAtivos', () => {
    it('declara todos os idiomas ativos e x-default, em qualquer versão da página', () => {
        for (const locale of ACTIVE_LOCALES) {
            const { languages } = buildAlternatesAtivos('cultura101', undefined, locale)
            for (const l of ACTIVE_LOCALES) expect(languages).toHaveProperty([LOCALE_META[l].htmlLang])
            expect(languages).toHaveProperty(['x-default'])
        }
    })
})

import { hreflangDe, idiomasComConteudo } from './alternates'
import { DEFAULT_LOCALE } from './config'

describe('hreflangDe', () => {
    it('põe x-default no idioma padrão só quando ele está na lista', () => {
        const url = (l: string) => `https://x/${l}`
        const com = hreflangDe([DEFAULT_LOCALE, 'en'], url)
        expect(com['x-default']).toBe(url(DEFAULT_LOCALE))
        expect(Object.keys(hreflangDe(['en'], url))).not.toContain('x-default')
    })
})

describe('idiomasComConteudo', () => {
    it('mantém só os idiomas com conteúdo, na ordem original', async () => {
        const r = await idiomasComConteudo(['en', 'es'], async (l) => l === 'es')
        expect(r).toEqual(['es'])
    })
})
