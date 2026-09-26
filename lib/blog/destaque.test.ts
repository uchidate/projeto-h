import { describe, it, expect } from 'vitest'
import type { WPPost } from '@/lib/wordpress/types'
import { candidatosDestaque, pontuar, escolherDestaque, escolherParaLeitor, maisLidos, perenes, diaCorrido } from './destaque'

const AGORA = new Date('2026-09-26T15:00:00Z')
const dias = (n: number) => new Date(AGORA.getTime() - n * 86_400_000).toISOString()
const post = (id: number, idade: number, views: number): WPPost => ({ id, slug: `p${id}`, date: dias(idade), acf: { views } } as unknown as WPPost)

describe('destaque do blog', () => {
    it('notícia nova não ganha de graça: com leitura alta em outro artigo, o mais lido lidera', () => {
        const pool = [post(1, 1, 0), post(2, 120, 400), post(3, 200, 30)]
        expect(candidatosDestaque(pool, AGORA, 1)[0].id).toBe(2)
    })

    it('artigo de até 3 dias recebe crédito de novidade (mediana dos mais lidos); o antigo sem leitura fica com zero', () => {
        const pool = [post(1, 1, 0), post(2, 200, 0), ...Array.from({ length: 10 }, (_, i) => post(i + 3, 100 + i, 10))]
        expect(pontuar(pool[0], pool, AGORA)).toBe(10)
        expect(pontuar(pool[1], pool, AGORA)).toBe(0)
    })

    it('o topo gira conforme o dia, só entre quem está perto do líder', () => {
        const pool = Array.from({ length: 8 }, (_, i) => post(i + 1, 30 + i * 10, 100 - i * 10))
        const hoje = candidatosDestaque(pool, AGORA, 1)[0].id
        const amanha = candidatosDestaque(pool, new Date(AGORA.getTime() + 86_400_000), 1)[0].id
        expect(amanha).not.toBe(hoje)
        expect([1, 2, 3, 4]).toContain(hoje)
        expect([1, 2, 3, 4]).toContain(amanha)
    })

    it('é determinístico no mesmo dia', () => {
        const pool = Array.from({ length: 8 }, (_, i) => post(i + 1, 30 + i, 50 + i))
        expect(escolherDestaque(pool, AGORA)?.id).toBe(escolherDestaque(pool, new Date('2026-09-26T23:00:00Z'))?.id)
    })

    it('vira o dia em São Paulo, não em UTC', () => {
        expect(diaCorrido(new Date('2026-09-27T02:00:00Z'))).toBe(diaCorrido(new Date('2026-09-26T12:00:00Z')))
        expect(diaCorrido(new Date('2026-09-27T04:00:00Z'))).toBe(diaCorrido(new Date('2026-09-26T12:00:00Z')) + 1)
    })

    it('leitor: pula o que já leu', () => {
        const c = [{ slug: 'a', categoria: 'k-pop' }, { slug: 'b', categoria: 'k-drama' }, { slug: 'c', categoria: 'k-pop' }]
        expect(escolherParaLeitor(c, [{ slug: 'a' }])).toBe(1)
    })

    it('leitor: favorece a categoria que mais lê (até 2 posições abaixo)', () => {
        const c = [{ slug: 'a', categoria: 'k-pop' }, { slug: 'b', categoria: 'k-drama' }, { slug: 'c', categoria: 'k-drama' }]
        const lidos = Array.from({ length: 4 }, (_, i) => ({ slug: `x${i}`, categoria: 'k-drama' }))
        expect(escolherParaLeitor(c, lidos)).toBe(1)
    })

    it('leitor sem histórico: fica com o destaque padrão', () => {
        expect(escolherParaLeitor([{ slug: 'a', categoria: 'k-pop' }, { slug: 'b', categoria: 'k-drama' }], [])).toBe(0)
    })

    it('lista vazia não tem destaque', () => {
        expect(escolherDestaque([], AGORA)).toBeNull()
    })

    it('mais lidos: ordena por leitura e ignora quem não tem nenhuma', () => {
        const r = maisLidos([post(1, 10, 5), post(2, 20, 0), post(3, 30, 9)])
        expect(r.map(p => p.id)).toEqual([3, 1])
    })

    it('perenes: só o que passa de 45 dias e segue entre os mais lidos', () => {
        const r = perenes([post(1, 10, 99), post(2, 100, 30), post(3, 60, 50), post(4, 300, 0)], 6, AGORA)
        expect(r.map(p => p.id)).toEqual([3, 2])
    })

    it('perenes: notícia fica de fora quando a categoria de notícias é informada', () => {
        const noticia = { ...post(5, 90, 80), categories: [7] } as unknown as WPPost
        const r = perenes([noticia, post(6, 100, 20)], 6, AGORA, [7])
        expect(r.map(p => p.id)).toEqual([6])
    })
})
