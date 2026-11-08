import { describe, expect, it, vi } from 'vitest'
import { metadataDeListagem } from './index'

const base = { titulo: 'T', descricao: 'D', url: 'https://x/lista', page: 1, totalPages: 3, temFiltro: false, urlDaPagina: (p: number) => `https://x/lista?page=${p}` }

describe('metadataDeListagem', () => {
    it('página 1 sem filtro: hreflang e next, sem prev nem noindex', async () => {
        const idiomas = vi.fn(async () => ({ pt: 'https://x/lista', en: 'https://x/en/list' }))
        const m = await metadataDeListagem({ ...base, idiomas })
        expect(m.alternates).toMatchObject({ canonical: base.url, languages: { en: 'https://x/en/list' }, next: 'https://x/lista?page=2' })
        expect(m.alternates).not.toHaveProperty('prev')
        expect(m.robots).toBeUndefined()
    })

    it('com filtro: não consulta idiomas e vai para noindex', async () => {
        const idiomas = vi.fn(async () => ({ pt: 'x' }))
        const m = await metadataDeListagem({ ...base, temFiltro: true, idiomas })
        expect(idiomas).not.toHaveBeenCalled()
        expect(m.alternates).not.toHaveProperty('languages')
        expect(m.robots).toEqual({ index: false, follow: true })
    })

    it('página além do fim: noindex; paginação desligada some com prev/next', async () => {
        const m = await metadataDeListagem({ ...base, page: 9, paginacaoAtiva: false })
        expect(m.robots).toEqual({ index: false, follow: true })
        expect(m.alternates).not.toHaveProperty('prev')
        expect(m.alternates).not.toHaveProperty('next')
    })

    it('página 2: tem prev e next, sem hreflang', async () => {
        const idiomas = vi.fn(async () => ({ pt: 'x' }))
        const m = await metadataDeListagem({ ...base, page: 2, idiomas })
        expect(idiomas).not.toHaveBeenCalled()
        expect(m.alternates).toMatchObject({ prev: 'https://x/lista?page=1', next: 'https://x/lista?page=3' })
    })
})
