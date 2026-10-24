import { describe, expect, it } from 'vitest'
import type { WPArtist } from '@/lib/wordpress/types'
import { mesesParaBuscar, montarAniversarios } from './aniversarios'

function artista(id: number, nome: string, nasc: string, morte?: string): WPArtist {
    return { id, slug: nome.toLowerCase(), title: { rendered: nome }, acf: { birth_date: nasc, death_date: morte } } as unknown as WPArtist
}

describe('montarAniversarios', () => {
    const lista = [
        artista(1, 'Hoje1', '1995-10-24'),
        artista(2, 'Amanha', '1990-10-25'),
        artista(3, 'Falecido', '1980-10-24', '2019-01-01'),
        artista(4, 'Hoje2', '2000-10-24'),
        artista(5, 'Fora', '1990-11-30'),
        artista(6, 'Dia3', '1991-10-27'),
    ]

    it('separa hoje dos próximos dias e ignora falecidos', () => {
        const r = montarAniversarios(lista, '2026-10-24')
        expect(r.hoje.map(a => a.nome)).toEqual(['Hoje1', 'Hoje2'])
        expect(r.seguintes.map(d => d.data)).toEqual(['2026-10-25', '2026-10-27'])
    })

    it('vira o mês e o ano', () => {
        const r = montarAniversarios([artista(7, 'Ano', '1999-01-02')], '2026-12-30')
        expect(r.seguintes).toMatchObject([{ data: '2027-01-02', nomes: [{ nome: 'Ano', slug: 'ano', idade: 28 }] }])
    })

    it('entrega a faixa de sete dias e a idade que completa', () => {
        const r = montarAniversarios(lista, '2026-10-24')
        expect(r.semana).toHaveLength(7)
        expect(r.semana[0]).toBe('2026-10-24')
        expect(r.hoje[0].idade).toBe(31)
    })

    it('limita nomes por dia', () => {
        const muitos = [1, 2, 3, 4, 5].map(i => artista(i, `N${i}`, '1990-10-25'))
        expect(montarAniversarios(muitos, '2026-10-24').seguintes[0].nomes).toHaveLength(3)
    })
})

describe('mesesParaBuscar', () => {
    it('um mês quando cabe', () => expect(mesesParaBuscar('2026-10-10')).toEqual([10]))
    it('dois meses perto do fim', () => expect(mesesParaBuscar('2026-10-28')).toEqual([10, 11]))
    it('dezembro vira janeiro', () => expect(mesesParaBuscar('2026-12-30')).toEqual([12, 1]))
})
