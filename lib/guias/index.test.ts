import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/wordpress/guias', () => ({
    getGuias: vi.fn(),
}))

import { getGuias } from '@/lib/wordpress/guias'
import { getAllHubs, getHub, getRelatedHubs, getGruposDeGuias, mesclarTexto, ALL_HUBS } from './index'

const base = ALL_HUBS[0]

describe('mesclarTexto', () => {
    it('sobrepõe só o texto preenchido e mantém slug, tipo e filtro do código', () => {
        const out = mesclarTexto(base, { slug: base.slug, title: 'Título do WP', intro: ['Parágrafo do WP'], kind: 'groups', filter: {} } as never)
        expect(out.title).toBe('Título do WP')
        expect(out.intro).toEqual(['Parágrafo do WP'])
        expect(out.kind).toBe(base.kind)
        expect(out.filter).toEqual(base.filter)
        expect(out.description).toBe(base.description)
    })

    it('campo vazio ou com formato errado não apaga o do código', () => {
        const out = mesclarTexto(base, { slug: base.slug, title: '  ', intro: [], faq: 'texto' as never, shortTitle: 3 as never })
        expect(out).toEqual(base)
    })

    it('leva o SEO do Rank Math', () => {
        const out = mesclarTexto(base, { slug: base.slug, seoTitle: 'SEO', seoDescription: 'Descrição SEO' })
        expect(out.seoTitle).toBe('SEO')
        expect(out.seoDescription).toBe('Descrição SEO')
    })
})

describe('getAllHubs / getHub', () => {
    beforeEach(() => vi.mocked(getGuias).mockResolvedValue([]))

    it('sem nada no WP, devolve os guias do código', async () => {
        vi.mocked(getGuias).mockResolvedValue([])
        expect(await getAllHubs()).toEqual(ALL_HUBS)
    })

    it('com um guia no WP, só ele muda e os outros seguem do código', async () => {
        vi.mocked(getGuias).mockResolvedValue([{ slug: base.slug, title: 'Novo' }])
        const todos = await getAllHubs()
        expect(todos).toHaveLength(ALL_HUBS.length)
        expect(todos[0].title).toBe('Novo')
        expect(todos[1]).toEqual(ALL_HUBS[1])
    })

    it('guia que só existe no WP não vira página', async () => {
        vi.mocked(getGuias).mockResolvedValue([{ slug: 'so-no-wp', title: 'X' }])
        expect(await getHub('so-no-wp')).toBeUndefined()
        expect((await getAllHubs()).some(h => h.slug === 'so-no-wp')).toBe(false)
    })

    it('getGruposDeGuias aplica o texto do WP dentro dos grupos', async () => {
        vi.mocked(getGuias).mockResolvedValue([{ slug: base.slug, shortTitle: 'Curto do WP' }])
        const hubs = (await getGruposDeGuias()).flatMap(k => k.grupos.flatMap(g => g.hubs))
        expect(hubs.find(h => h.slug === base.slug)?.shortTitle).toBe('Curto do WP')
    })
})

describe('getRelatedHubs', () => {
    beforeEach(() => vi.mocked(getGuias).mockResolvedValue([]))

    it('retorna hubs do mesmo kind, excluindo o próprio hub', async () => {
        const target = ALL_HUBS.find(h => h.kind === 'productions')!
        const related = await getRelatedHubs(target)
        expect(related.every(h => h.kind === 'productions')).toBe(true)
        expect(related.some(h => h.slug === target.slug)).toBe(false)
    })

    it('respeita o limit', async () => {
        const target = ALL_HUBS.find(h => h.kind === 'productions')!
        expect((await getRelatedHubs(target)).length).toBeLessThanOrEqual(6)
        expect((await getRelatedHubs(target, 2)).length).toBeLessThanOrEqual(2)
    })
})

describe('mesclarTexto com traduções', () => {
    it('leva as traduções do WordPress no guia', () => {
        const out = mesclarTexto(base, { slug: base.slug, translations: { en: { title: 'EN' } } })
        expect(out.traducoes?.en?.title).toBe('EN')
    })
})
