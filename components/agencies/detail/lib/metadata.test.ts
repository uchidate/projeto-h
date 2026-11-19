import { beforeEach, describe, expect, it, vi } from 'vitest'

const agencia = vi.fn()
vi.mock('@/lib/wordpress/agencies', () => ({ getAgencyBySlug: () => agencia() }))
vi.mock('next-intl/server', () => ({
    getTranslations: async () => (k: string, v: { name: string }) =>
        k === 'metaTitle' ? `${v.name}: artistas, grupos e história` : `Sobre ${v.name}`,
}))

import { metadataDaAgencia } from './metadata'

const base = {
    id: 1, slug: 'maroo-entertainment', title: { rendered: 'Maroo Entertainment' },
    excerpt: { rendered: '<p>Excerpt curto da agência.</p>' },
}

describe('metadataDaAgencia', () => {
    beforeEach(() => agencia.mockReset())

    it('usa o título e a descrição do Rank Math quando gravados', async () => {
        agencia.mockReturnValue({ ...base, meta: { rank_math_title: 'Maroo Entertainment: agência de 2010', rank_math_description: 'Descrição do Rank Math.' } })
        const m = await metadataDaAgencia('maroo-entertainment')
        expect(String(m.title)).toContain('Maroo Entertainment: agência de 2010')
        expect(m.description).toBe('Descrição do Rank Math.')
    })

    it('sem Rank Math, cai no modelo e no excerpt', async () => {
        agencia.mockReturnValue({ ...base, meta: { rank_math_title: '' } })
        const m = await metadataDaAgencia('maroo-entertainment')
        expect(String(m.title)).toContain('Maroo Entertainment: artistas, grupos e história')
        expect(m.description).toBe('Excerpt curto da agência.')
    })

    it('o Rank Math vence o título do Yoast', async () => {
        agencia.mockReturnValue({ ...base, meta: { rank_math_title: 'Título novo' }, yoast_head_json: { title: 'Título velho', og_title: 'Título velho' } })
        const m = await metadataDaAgencia('maroo-entertainment')
        expect(String(m.title)).toContain('Título novo')
    })
})
