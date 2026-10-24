import { describe, expect, it } from 'vitest'
import { escolherFichas } from './temas'

const f = (slug: string, img: string | null, links: number[] = []) => ({ id: 1, slug, title: { rendered: slug }, featured_image_url: img, acf: { linked_products: links } })

describe('escolherFichas', () => {
    it('ignora ficha sem imagem e põe as com produto vinculado primeiro', () => {
        const r = escolherFichas([f('a', 'x'), f('b', null, [1]), f('c', 'y', [1, 2])], 2)
        expect(r.map(x => x.slug)).toEqual(['c', 'a'])
        expect(r[0].naLoja).toBe(2)
    })
})
