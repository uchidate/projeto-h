import type { StoreProduct } from '@/lib/wordpress/store'

/**
 * Troca o último cartão visível por um produto da `loja` quando nenhum dos exibidos já é dela.
 * Determinístico: serve ao primeiro render (SSR) e ao sorteio no navegador. O slot de descoberta é reservado.
 *
 * Usado com 'shopee' em toda faixa da loja: no programa de afiliados da Shopee, o clique abre uma janela
 * de 7 dias (central de ajuda da Shopee) e, segundo os guias de afiliados, a compra de outro produto
 * nesse prazo também conta para o afiliado (último clique vence). No Mercado Livre a janela relatada
 * é de cerca de 24 h. Um clique na Shopee vale mais que o item clicado; a relevância continua mandando
 * no resto da ordem (o Mercado Livre segue com mais cliques: 180 contra 71 em 60 dias até 2026-11-18).
 */
export function garantirLoja(selecionados: StoreProduct[], produtos: StoreProduct[], loja: string): StoreProduct[] {
    if (selecionados.some(p => p.acf.store === loja)) return selecionados
    const candidato = produtos.find(p => p.acf.store === loja && !selecionados.includes(p))
    if (!candidato || selecionados.length === 0) return selecionados
    let alvo = selecionados.length - 1
    while (alvo > 0 && selecionados[alvo].descoberta) alvo--
    if (selecionados[alvo].descoberta) return selecionados
    return selecionados.map((p, i) => (i === alvo ? candidato : p))
}
