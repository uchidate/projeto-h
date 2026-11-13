import { describe, expect, it } from 'vitest'
import { ACTIVE_LOCALES } from '@/lib/i18n/config'
import { buildLlmsTxt } from './llmsTxt'

describe('llms.txt', () => {
    const txt = buildLlmsTxt()
    it('começa com o título e a citação do site', () => {
        expect(txt.startsWith('# ')).toBe(true)
        expect(txt).toContain('\n> ')
    })
    it('lista as seções em cada idioma ativo, com o caminho do idioma', () => {
        for (const locale of ACTIVE_LOCALES) expect(txt).toContain(`## ${locale === 'pt' ? 'pt-BR' : locale}`)
        expect(txt).toMatch(/\[Artistas\]\([^)]*\/artists\)/)
        expect(txt).toMatch(/\/en\/artists\)/)
        expect(txt).toMatch(/\/en\/companies\)/)
    })
    it('aponta os sitemaps e não promete treino de modelo', () => {
        expect(txt).toContain('/sitemap-static.xml')
        expect(txt).toContain('Treino de modelos não é permitido')
    })
})
