import { describe, it, expect } from 'vitest'
import type { WPProduction } from '@/lib/wordpress/types'
import { obrasEmDestaque, marcosDaCarreira, fichaMagra, anoDaObra } from './obrasEmDestaque'

const obra = (id: number, year: number, rating = 0, img = 'x.jpg') =>
    ({ id, slug: `o${id}`, date: `${year}-01-01`, featured_image_url: img, acf: { year, rating } }) as unknown as WPProduction

describe('obrasEmDestaque', () => {
    it('ordena por nota e desempata pelo ano mais recente', () => {
        const r = obrasEmDestaque([obra(1, 2010, 7), obra(2, 2020, 9), obra(3, 2022, 7)])
        expect(r.map(o => o.id)).toEqual([2, 3, 1])
    })
    it('ignora obra sem pôster e respeita o limite', () => {
        const r = obrasEmDestaque([obra(1, 2010, 9, ''), obra(2, 2011, 8), obra(3, 2012, 7)], 1)
        expect(r.map(o => o.id)).toEqual([2])
    })
})

describe('obrasEmDestaque: especiais', () => {
    const esp = (id: number) => ({ ...obra(id, 2025, 10), acf: { year: 2025, rating: 10, type: 'special' } }) as unknown as WPProduction
    it('deixa making of fora quando há obras principais suficientes', () => {
        const r = obrasEmDestaque([esp(9), obra(1, 2010, 5), obra(2, 2011, 4), obra(3, 2012, 3)])
        expect(r.map(o => o.id)).toEqual([1, 2, 3])
    })
    it('mantém os especiais quando faltam obras', () => {
        expect(obrasEmDestaque([esp(9), obra(1, 2010, 5)]).map(o => o.id)).toEqual([9, 1])
    })
})

describe('marcosDaCarreira', () => {
    it('devolve vazio com menos de 4 obras datadas', () => {
        expect(marcosDaCarreira([obra(1, 2000), obra(2, 2005), obra(3, 2010)])).toEqual([])
    })
    it('inclui a mais antiga e as melhores, em ordem cronológica', () => {
        const r = marcosDaCarreira([obra(1, 1998, 5), obra(2, 2013, 8), obra(3, 2021, 9), obra(4, 2022, 7), obra(5, 2015, 3)], 4)
        expect(r.map(m => m.ano)).toEqual([1998, 2013, 2021, 2022])
    })
})

describe('anoDaObra', () => {
    it('cai para a data quando não há ano', () => {
        expect(anoDaObra({ date: '2019-05-01', acf: {} } as unknown as WPProduction)).toBe(2019)
    })
})

describe('fichaMagra', () => {
    it('é magra sem capítulos, análise, obras e com bio curta', () => {
        expect(fichaMagra({ hasStoryChapters: false, hasAnalysis: false, productions: 0, bioChars: 120 })).toBe(true)
    })
    it('deixa de ser magra com qualquer conteúdo próprio', () => {
        expect(fichaMagra({ hasStoryChapters: true, hasAnalysis: false, productions: 0, bioChars: 120 })).toBe(false)
        expect(fichaMagra({ hasStoryChapters: false, hasAnalysis: false, productions: 1, bioChars: 120 })).toBe(false)
        expect(fichaMagra({ hasStoryChapters: false, hasAnalysis: false, productions: 0, bioChars: 900 })).toBe(false)
    })
})
