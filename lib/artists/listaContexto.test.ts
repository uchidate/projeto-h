import { describe, expect, it } from 'vitest'
import { vizinhos, type ContextoLista } from './listaContexto'

const item = (slug: string) => ({ slug, nome: slug, foto: null, papel: null })
const ctx: ContextoLista = { href: '/artists?role=singer', rotulo: 'Em alta · Cantores', inicio: 49, total: 300, itens: [item('a'), item('b'), item('c')] }

describe('vizinhos', () => {
    it('acha anterior, próximo e a posição no total', () => {
        const v = vizinhos(ctx, 'b')!
        expect(v.anterior?.slug).toBe('a')
        expect(v.proximo?.slug).toBe('c')
        expect(v.posicao).toBe(50)
        expect(v.total).toBe(300)
    })
    it('não inventa vizinho nas pontas', () => {
        expect(vizinhos(ctx, 'a')!.anterior).toBeNull()
        expect(vizinhos(ctx, 'c')!.proximo).toBeNull()
    })
    it('devolve nulo quando o artista não está na lista ou não há contexto', () => {
        expect(vizinhos(ctx, 'z')).toBeNull()
        expect(vizinhos(null, 'a')).toBeNull()
    })
})
