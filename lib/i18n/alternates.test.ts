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
