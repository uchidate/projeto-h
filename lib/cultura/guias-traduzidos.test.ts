import { describe, expect, it } from 'vitest'
import tabela from './guias-traduzidos.json'

describe('guias de cultura traduzidos', () => {
    const en = tabela.en as Record<string, string>
    it('todo guia tem slug em inglês único e válido', () => {
        const slugs = Object.values(en)
        expect(slugs.length).toBeGreaterThanOrEqual(33)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/)
    })
})
