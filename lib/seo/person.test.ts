import { describe, expect, it } from 'vitest'
import type { WPProduction } from '@/lib/wordpress/types'
import { alternateNames, performerIn } from './person'

const prod = (slug: string, acf: Record<string, unknown>, titulo = slug): WPProduction =>
    ({ id: 1, slug, title: { rendered: titulo }, acf } as unknown as WPProduction)
const url = (s: string) => `https://x.test/productions/${s}`

describe('alternateNames', () => {
    it('põe o hangul primeiro e depois as grafias romanizadas', () => {
        const r = alternateNames('Moo Jin-sung', '무진성')!
        expect(r[0]).toBe('무진성')
        expect(r).toEqual(expect.arrayContaining(['Mu Jin-sung', 'Moo Jinsung', 'Jin-sung Moo']))
        expect(r).not.toContain('Moo Jin-sung')
    })

    it('sem hangul, só as grafias; sem nada, undefined (campo omitido)', () => {
        expect(alternateNames('Lee Sung-min', null)?.[0]).toBe('Lee Sungmin')
        expect(alternateNames('Kangnam', undefined)).toBeUndefined()
    })

    it('não repete o hangul nem entradas vazias', () => {
        expect(alternateNames('Kangnam', '  ')).toBeUndefined()
        expect(alternateNames('Kangnam', '강남')).toEqual(['강남'])
    })
})

describe('performerIn', () => {
    it('mapeia filme e série, com o ano como datePublished', () => {
        const r = performerIn([prod('f', { type: 'movie', year: 2023 }, 'Filme'), prod('s', { type: 'drama', year: 2020 }, 'Série')], url)
        expect(r).toEqual([
            { '@type': 'Movie', name: 'Filme', url: url('f'), datePublished: '2023' },
            { '@type': 'TVSeries', name: 'Série', url: url('s'), datePublished: '2020' },
        ])
    })

    it('ordena da mais recente para a mais antiga e respeita o limite', () => {
        const r = performerIn([prod('a', { year: 2001 }), prod('b', { year: 2010 }), prod('c', { year: 2005 })], url, 2)
        expect(r?.map(o => o.url)).toEqual([url('b'), url('c')])
    })

    it('obra sem ano não inventa data, e HTML do título é limpo', () => {
        const [o] = performerIn([prod('a', { type: 'movie' }, 'A &amp; <i>B</i>')], url)!
        expect(o).not.toHaveProperty('datePublished')
        expect(o.name).not.toContain('<')
    })

    it('sem obras, undefined', () => {
        expect(performerIn([], url)).toBeUndefined()
    })
})
