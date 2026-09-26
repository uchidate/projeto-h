import { describe, it, expect } from 'vitest'
import { motivoDaSugestao } from './motivoSugestao'
import type { WPPost } from '@/lib/wordpress/types'

// `cats` guarda id e nome; o candidato real só traz os ids em `categories`, e o
// nome sai do `_embedded` do artigo atual — o teste reproduz essa forma.
const post = (extra: Partial<WPPost> & { cats?: Array<{ id: number; name: string }> } = {}): WPPost => {
    const { cats = [], ...resto } = extra
    return {
        id: 1, slug: 'x', title: { rendered: 'X' },
        categories: cats.map(c => c.id),
        _embedded: { 'wp:term': [cats.map(c => ({ taxonomy: 'category', slug: String(c.id), ...c }))] },
        ...resto,
    } as unknown as WPPost
}
const vazio = { artists: [], productions: [], groups: [], foods: [], companies: [] }

describe('motivoDaSugestao', () => {
    it('cita a entidade que os dois artigos compartilham, com a foto dela', () => {
        const atual = post({ related_entities: { ...vazio, groups: [{ id: 1, name: 'BLACKPINK', slug: 'blackpink', image: '/bp.jpg' }] } })
        const outro = post({ related_entities: { ...vazio, groups: [{ id: 1, name: 'BLACKPINK', slug: 'blackpink', image: '/bp.jpg' }] } })
        expect(motivoDaSugestao(atual, outro)).toEqual({ texto: 'Também fala de BLACKPINK', imagem: '/bp.jpg' })
    })

    it('grupo vence artista e artista vence produção quando há mais de uma em comum', () => {
        const g = { id: 1, name: 'BTS', slug: 'bts', image: null }
        const p = { id: 2, name: 'Jimin', slug: 'jimin', image: null, roles: [] }
        const prod = { id: 3, title: 'Run BTS', slug: 'run-bts', image: null }
        const atual = post({ related_entities: { ...vazio, groups: [g], artists: [p], productions: [prod] } })
        const outro = post({ related_entities: { ...vazio, groups: [g], artists: [p], productions: [prod] } })
        expect(motivoDaSugestao(atual, outro)?.texto).toBe('Também fala de BTS')
        const semGrupo = post({ related_entities: { ...vazio, artists: [p], productions: [prod] } })
        expect(motivoDaSugestao(atual, semGrupo)?.texto).toBe('Também fala de Jimin')
    })

    it('sem entidade em comum, cai para a categoria em comum', () => {
        const atual = post({ cats: [{ id: 5, name: 'K-Pop' }] })
        const outro = post({ cats: [{ id: 5, name: 'K-Pop' }] })
        expect(motivoDaSugestao(atual, outro)).toEqual({ texto: 'Mais em K-Pop', imagem: null })
    })

    it('sem nada em comum devolve null, não inventa motivo', () => {
        expect(motivoDaSugestao(post({ cats: [{ id: 1, name: 'A' }] }), post({ cats: [{ id: 2, name: 'B' }] }))).toBeNull()
    })

    it('com categoria: false só devolve motivo de entidade', () => {
        const atual = post({ cats: [{ id: 5, name: 'K-Pop' }] })
        const outro = post({ cats: [{ id: 5, name: 'K-Pop' }] })
        expect(motivoDaSugestao(atual, outro, { categoria: false })).toBeNull()
        const g = { id: 1, name: 'BTS', slug: 'bts', image: null }
        const comGrupo = post({ related_entities: { ...vazio, groups: [g] } })
        expect(motivoDaSugestao(comGrupo, comGrupo, { categoria: false })?.texto).toBe('Também fala de BTS')
    })
})
