import type { StoreProduct } from '@/lib/wordpress/store'

/**
 * Troca o último cartão visível por um produto da `loja` quando nenhum dos exibidos já é dela.
 * `posicao` (opcional): o cartão que precisa ser da loja quando a faixa não mostra tudo de cara (fileira no
 * celular); sem ela, vale qualquer um e a troca cai no último. Determinístico: serve ao primeiro render (SSR) e ao sorteio no navegador. O slot de descoberta é reservado.
 *
 * Usado com 'shopee' em toda faixa da loja: no programa de afiliados da Shopee, o clique abre uma janela
 * de 7 dias (central de ajuda da Shopee) e, segundo os guias de afiliados, a compra de outro produto
 * nesse prazo também conta para o afiliado (último clique vence). No Mercado Livre a janela relatada
 * é de cerca de 24 h. Um clique na Shopee vale mais que o item clicado; a relevância continua mandando
 * no resto da ordem (o Mercado Livre segue com mais cliques: 180 contra 71 em 60 dias até 2026-11-18).
 */
export function garantirLoja(selecionados: StoreProduct[], produtos: StoreProduct[], loja: string, posicao?: number): StoreProduct[] {
    const visiveis = posicao === undefined ? selecionados : selecionados.slice(0, posicao + 1)
    if (visiveis.some(p => p.acf.store === loja)) return selecionados
    // Já está na lista, mas fora da vista: sobe para a posição pedida em vez de trocar por outro.
    const jaNaLista = selecionados.findIndex(p => p.acf.store === loja)
    if (jaNaLista >= 0 && posicao !== undefined) {
        const saida = [...selecionados]
        const [item] = saida.splice(jaNaLista, 1)
        saida.splice(posicao, 0, item)
        return saida
    }
    const candidato = produtos.find(p => p.acf.store === loja && !selecionados.includes(p))
    if (!candidato || selecionados.length === 0) return selecionados
    let alvo = posicao === undefined ? selecionados.length - 1 : Math.min(posicao, selecionados.length - 1)
    while (alvo > 0 && selecionados[alvo].descoberta) alvo--
    if (selecionados[alvo].descoberta) return selecionados
    return selecionados.map((p, i) => (i === alvo ? candidato : p))
}
