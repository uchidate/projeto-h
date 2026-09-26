import { describe, expect, it } from 'vitest'
import { aniversariosDaSemana, hojeEmSaoPaulo, mesesDaJanela } from './aniversarios'
import type { WPArtist } from '@/lib/wordpress/types'

const artista = (slug: string, nasc: string, extra: Record<string, unknown> = {}) => ({
    id: 1, slug, title: { rendered: slug }, acf: { birth_date: nasc, ...extra }, featured_image_url: null,
}) as unknown as WPArtist

const hoje = { ano: 2026, mes: 9, dia: 26 }

describe('aniversariosDaSemana', () => {
    it('inclui hoje e os próximos dias, do mais perto ao mais longe', () => {
        const r = aniversariosDaSemana([
            artista('c', '1997-09-29'), artista('a', '1991-09-26'), artista('b', '2001-09-27'),
        ], hoje)
        expect(r.map(x => x.slug)).toEqual(['a', 'b', 'c'])
        expect(r[0].quando).toBe('Hoje · 35 anos')
        expect(r[1].quando).toBe('27 set · 25 anos')
    })
    it('ignora quem está fora da janela e quem já faleceu', () => {
        const r = aniversariosDaSemana([
            artista('longe', '1990-10-20'), artista('passou', '1990-09-25'), artista('morto', '1950-09-27', { death_date: '2020-01-01' }),
        ], hoje)
        expect(r).toEqual([])
    })
    it('vira o mês e o ano', () => {
        const r = aniversariosDaSemana([artista('ano', '1995-01-01')], { ano: 2026, mes: 12, dia: 28 })
        expect(r[0].quando).toBe('1 jan · 32 anos')
    })
    it('respeita o limite', () => {
        const muitos = Array.from({ length: 9 }, (_, i) => artista(`x${i}`, '1990-09-27'))
        expect(aniversariosDaSemana(muitos, hoje, 7, 5)).toHaveLength(5)
    })
})

describe('mesesDaJanela', () => {
    it('devolve um mês quando a semana cabe nele e dois quando vira', () => {
        expect(mesesDaJanela({ ano: 2026, mes: 9, dia: 10 })).toEqual([9])
        expect(mesesDaJanela({ ano: 2026, mes: 9, dia: 28 })).toEqual([9, 10])
    })
})

describe('hojeEmSaoPaulo', () => {
    it('usa o fuso de São Paulo, não o do servidor', () => {
        expect(hojeEmSaoPaulo(new Date('2026-09-27T01:30:00Z'))).toEqual({ ano: 2026, mes: 9, dia: 26 })
    })
})
