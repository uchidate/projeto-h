import { describe, expect, it } from 'vitest'
import type { Fandom } from '@/lib/wordpress/fandoms'
import { torcidasParecidas } from './afinidade'

function fandom(slug: string, acf: Record<string, unknown>): Fandom {
    return { slug, name: slug.toUpperCase(), color: null, lightstick: null, groups: [{ id: 1, slug, title: { rendered: slug }, acf }] } as unknown as Fandom
}

const alvo = fandom('army', { agency: 1, type: 'boy_group', debut_date: '20130613', popularity_score: 90 })

describe('torcidas parecidas', () => {
    it('mesma agência vem antes de mesmo tipo', () => {
        const mesmaAgencia = fandom('a', { agency: 1, type: 'girl_group', debut_date: '20200101' })
        const mesmoTipo = fandom('b', { agency: 2, type: 'boy_group', debut_date: '20200101' })
        expect(torcidasParecidas(alvo, [mesmoTipo, mesmaAgencia]).map(f => f.slug)).toEqual(['a', 'b'])
    })
    it('estreia próxima soma pontos', () => {
        const perto = fandom('perto', { agency: 2, type: 'girl_group', debut_date: '20140101' })
        const longe = fandom('longe', { agency: 2, type: 'girl_group', debut_date: '20240101' })
        expect(torcidasParecidas(alvo, [longe, perto]).map(f => f.slug)).toEqual(['perto', 'longe'])
    })
    it('não inclui a própria torcida e respeita o limite', () => {
        const todas = [alvo, ...Array.from({ length: 12 }, (_, i) => fandom(`f${i}`, { agency: 1 }))]
        const r = torcidasParecidas(alvo, todas, 5)
        expect(r).toHaveLength(5)
        expect(r.some(f => f.slug === 'army')).toBe(false)
    })
    it('empate decidido pela popularidade', () => {
        const a = fandom('a', { agency: 9, popularity_score: 10 })
        const b = fandom('b', { agency: 9, popularity_score: 50 })
        expect(torcidasParecidas(alvo, [a, b]).map(f => f.slug)).toEqual(['b', 'a'])
    })
    it('dado faltando não quebra', () => {
        const vazio = { slug: 'x', name: 'X', color: null, lightstick: null, groups: [] } as unknown as Fandom
        expect(torcidasParecidas(alvo, [vazio])).toHaveLength(1)
    })
})
