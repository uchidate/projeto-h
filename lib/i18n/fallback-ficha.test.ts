import { describe, it, expect } from 'vitest'
import { comoFallback } from './fallback-ficha'

describe('comoFallback', () => {
    it('tira a página do índice e mantém o resto dos metadados (canonical incluso)', () => {
        const base = { title: 'CJ ENM', alternates: { canonical: 'https://exemplo.com/empresas/cj-enm' } }
        const meta = comoFallback(base)
        expect(meta.robots).toEqual({ index: false, follow: true })
        expect(meta.alternates).toEqual(base.alternates)
        expect(meta.title).toBe('CJ ENM')
    })
})
