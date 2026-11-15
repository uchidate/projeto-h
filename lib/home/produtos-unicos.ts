import type { StoreProduct } from '@/lib/wordpress/store'

/**
 * Um produto aparece em uma só prateleira da home. As listas chegam na ordem de prioridade
 * (quem vem antes fica com o produto) e cada uma é cortada no seu limite depois de pular
 * o que já foi usado; por isso quem chama busca candidatos de sobra.
 */
export function semProdutoRepetido(listas: { produtos: StoreProduct[]; limite: number }[]): StoreProduct[][] {
    const usados = new Set<number>()
    return listas.map(({ produtos, limite }) => {
        const livres = produtos.filter(p => !usados.has(p.id)).slice(0, limite)
        for (const p of livres) usados.add(p.id)
        return livres
    })
}
