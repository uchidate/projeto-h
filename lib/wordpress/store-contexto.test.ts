import { describe, expect, it } from 'vitest'
import { detectarTemas, escolherPorTema } from './store-contexto'
import type { StoreProduct } from './store'

function produto(id: number, titulo: string, category: string, extra: Partial<StoreProduct['acf']> = {}): StoreProduct {
    return {
        id, title: { rendered: titulo }, date_gmt: '2026-10-01T00:00:00',
        acf: {
            price: 'R$ 10,00', original_price: null, image_url: 'https://x/y.jpg', affiliate_url: 'https://x/a',
            store: 'mercadolivre', category, badge: null, rating: null, sold_count: null, featured: false,
            is_hidden: false, position: 50, related_group: null, related_artist: null, price_history: null, ...extra,
        },
    }
}

describe('detectarTemas', () => {
    it('reconhece beleza, culinária e música', () => {
        expect(detectarTemas('Rotina de skincare coreano')).toContain('beleza')
        expect(detectarTemas('Receita de tteokbokki')).toContain('culinaria')
        expect(detectarTemas('Comeback e novo álbum')).toContain('musica')
    })
    it('texto neutro não gera tema', () => {
        expect(detectarTemas('Entrevista exclusiva')).toEqual([])
    })
})

describe('escolherPorTema', () => {
    const catalogo = [
        produto(1, 'Sérum Medicube Collagen', 'kbeauty'),
        produto(2, 'Creme Anua Heartleaf', 'kbeauty'),
        produto(3, 'Photocard Guerreiras Do Kpop', 'photocard'),
        produto(4, 'Lightstick BTS Army Bomb', 'lightstick'),
        produto(5, 'Sem imagem Medicube', 'kbeauty', { image_url: null }),
        produto(6, 'Escondido Medicube', 'kbeauty', { is_hidden: true }),
    ]
    it('tema de beleza prioriza kbeauty e ignora sem imagem ou escondido', () => {
        const ids = escolherPorTema(catalogo, { texto: 'Guia de skincare coreano' }).map(p => p.id)
        expect(ids).toEqual(expect.arrayContaining([1, 2]))
        expect(ids).not.toContain(5)
        expect(ids).not.toContain(6)
        expect(ids).not.toContain(3)
    })
    it('palavra do título do produto no texto da página vence o tema', () => {
        const ids = escolherPorTema(catalogo, { texto: 'Guerreiras do Kpop: tudo sobre o filme' }).map(p => p.id)
        expect(ids[0]).toBe(3)
    })
    it('sem sinal nenhum devolve vazio', () => {
        expect(escolherPorTema(catalogo, { texto: 'Entrevista exclusiva' })).toEqual([])
    })
    it('vários temas limitam por categoria', () => {
        const muitos = Array.from({ length: 10 }, (_, i) => produto(100 + i, `Item ${i}`, 'kbeauty'))
        const ids = escolherPorTema(muitos, { temas: ['drama'], maxPorCategoria: 3 })
        expect(ids).toHaveLength(3)
    })
})
