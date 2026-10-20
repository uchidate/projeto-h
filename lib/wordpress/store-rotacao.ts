import type { StoreProduct } from './store'
import { calcularDesconto } from './store'

/** Peso de um produto no sorteio da prateleira. `posicao` 0 = o mais aderente/bem ranqueado (a ordem de entrada já embute aderência, CTR e comissão). */
export function pesoNaPrateleira(p: StoreProduct, posicao: number, vistosRecentes: ReadonlySet<number>): number {
    const base = Math.pow(1 / (posicao + 1), 0.6)                     // decai devagar: o melhor aparece mais, os demais ainda entram
    const comercial = p.acf.featured || calcularDesconto(p.acf.price, p.acf.original_price) !== null ? 1.5 : 1
    const repetido = vistosRecentes.has(p.id) ? 0.25 : 1              // o que o visitante acabou de ver cede lugar
    return base * comercial * repetido
}

/**
 * Escolhe `quantidade` produtos por sorteio ponderado sem reposição. Ninguém é fixo: aderência (posição),
 * destaque/desconto e novidade para o visitante só mudam a chance. Devolve na ordem original (mais aderente primeiro).
 */
export function sortearPrateleira(produtos: StoreProduct[], quantidade: number, vistosRecentes: ReadonlySet<number> = new Set(), aleatorio: () => number = Math.random): StoreProduct[] {
    const pool = produtos.map((p, i) => ({ p, i, peso: pesoNaPrateleira(p, i, vistosRecentes) }))
    const escolhidos: typeof pool = []
    while (escolhidos.length < quantidade && pool.length > 0) {
        const total = pool.reduce((s, x) => s + x.peso, 0)
        let alvo = aleatorio() * total
        let k = 0
        for (; k < pool.length - 1; k++) {
            alvo -= pool[k].peso
            if (alvo <= 0) break
        }
        escolhidos.push(pool.splice(k, 1)[0])
    }
    return escolhidos.sort((a, b) => a.i - b.i).map(x => x.p)
}
