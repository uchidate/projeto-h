import { describe, expect, it } from 'vitest'
import { escolherCenas } from './imagens'

const b = (p: string, lang: string | null, v = 5) => ({ file_path: p, iso_639_1: lang, vote_average: v })

describe('escolherCenas', () => {
    it('prefere imagens sem texto quando há o bastante', () => {
        const r = escolherCenas({ backdrops: [b('/a.jpg', 'ko', 9), b('/b.jpg', null, 5), b('/c.jpg', null, 7), b('/d.jpg', null, 6)] })
        expect(r.map(u => u.split('/').pop())).toEqual(['c.jpg', 'd.jpg', 'b.jpg'])
    })
    it('cai para todas quando poucas são sem texto e respeita o limite', () => {
        const r = escolherCenas({ backdrops: [b('/a.jpg', 'ko', 9), b('/b.jpg', null, 5), b('/c.jpg', 'en', 7)] }, 2)
        expect(r).toHaveLength(2)
        expect(r[0]).toContain('/a.jpg')
    })
    it('vazio sem imagens', () => {
        expect(escolherCenas({})).toEqual([])
    })
})
