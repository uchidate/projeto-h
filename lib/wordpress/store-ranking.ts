/**
 * Usa `node:fs` — NUNCA importar deste arquivo a partir de um client
 * component (ex.: StoreCard.tsx). Foi separado de store.ts justamente porque
 * StoreCard é 'use client' e importa funções puras de lá; misturar `node:fs`
 * naquele módulo quebrou o build do Turbopack ("chunking context does not
 * support external modules: node:fs") ao tentar levar fs pro bundle do
 * navegador. Só componentes de servidor (rotas, `page.tsx`) devem importar
 * daqui.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { calcularDesconto, type StoreProduct } from './store'
import { rankingRemoto, parseRanking, type RankingCliques } from './ranking-remoto'

/**
 * Fonte principal: o ranking remoto (ranking-remoto.ts), que o servidor regenera todo dia.
 * Reserva: data/click-ranking.json, gerado offline (`gerar-ranking-cliques.mjs` do repo .operacao)
 * e lido uma vez por processo. Sem nenhum dos dois o ranking fica vazio e a ordenação cai nos
 * critérios de sempre, sem quebrar nada.
 */
let rankingCliques: RankingCliques | null = null
function carregarRankingCliques(): RankingCliques {
    // Remoto (atualizado todo dia pelo servidor) vence; o arquivo do deploy é a reserva.
    const remoto = rankingRemoto()
    if (remoto) return remoto
    if (rankingCliques) return rankingCliques
    try {
        const bruto = readFileSync(path.join(process.cwd(), 'data/click-ranking.json'), 'utf-8')
        rankingCliques = parseRanking(JSON.parse(bruto)) ?? { neutro: 0, global: {}, porContexto: {} }
    } catch {
        rankingCliques = { neutro: 0, global: {}, porContexto: {} }
    }
    return rankingCliques
}

/** Score de cliques do produto: por contexto (mais específico) quando disponível, senão o global. */
export function scoreClique(produto: StoreProduct, contexto?: string): number {
    const ranking = carregarRankingCliques()
    const porContexto = contexto ? ranking.porContexto[contexto]?.[produto.id] : undefined
    return porContexto ?? ranking.global[String(produto.id)] ?? ranking.neutro
}

/**
 * Ordem de exibição dentro de uma prateleira: com preço > destaque > desconto > CTR
 * recente (Umami, via `data/click-ranking.json`) > posição manual.
 *
 * `contexto` deixa o CTR responder "o que converte NESTA vitrine" (ex.:
 * "artista:jisoo-kim") em vez de só popularidade geral — os dois produtos
 * podem ter fãs bem diferentes. Sem contexto, ou sem dado pro contexto pedido,
 * cai no score global do produto.
 */
const comissao = (p: StoreProduct) => {
    const n = Number(String(p.acf.commission_rate ?? '').replace(',', '.'))
    return Number.isFinite(n) && n > 0 ? n : -1
}

export function ordenarPrateleira(produtos: StoreProduct[], contexto?: string, aderencia?: Map<number, number>): StoreProduct[] {
    return [...produtos].sort((a, b) => {
        // Aderência ao conteúdo da página manda; as métricas abaixo só decidem entre produtos igualmente aderentes.
        const aderA = aderencia?.get(a.id) ?? 0
        const aderB = aderencia?.get(b.id) ?? 0
        if (aderA !== aderB) return aderB - aderA
        // Sem preço o cartão converte pior: vai para o fim, mesmo sendo destaque.
        const precoA = a.acf.price ? 1 : 0
        const precoB = b.acf.price ? 1 : 0
        if (precoA !== precoB) return precoB - precoA
        const destaqueA = a.acf.featured ? 1 : 0
        const destaqueB = b.acf.featured ? 1 : 0
        if (destaqueA !== destaqueB) return destaqueB - destaqueA
        const descA = calcularDesconto(a.acf.price, a.acf.original_price) ?? -1
        const descB = calcularDesconto(b.acf.price, b.acf.original_price) ?? -1
        if (descA !== descB) return descB - descA
        const cliqueA = scoreClique(a, contexto)
        const cliqueB = scoreClique(b, contexto)
        // CTR dentro de 0,5 ponto é empate: aí quem paga mais comissão sobe (sem dado = -1, nunca à frente).
        if (Math.abs(cliqueA - cliqueB) >= 0.5) return cliqueB - cliqueA
        const comA = comissao(a)
        const comB = comissao(b)
        if (comA !== comB) return comB - comA
        if (cliqueA !== cliqueB) return cliqueB - cliqueA
        return (a.acf.position ?? 999) - (b.acf.position ?? 999)
    })
}

/**
 * Ordem das categorias na página da loja: a que mais converte sobe. Soma, por categoria, o quanto cada
 * produto está acima do neutro (CTR suavizado); empate (inclusive sem dado nenhum) fica com a categoria
 * de mais produtos, depois a ordem alfabética, para a página não mudar de lugar à toa.
 */
export function ordenarCategorias(porCategoria: Record<string, StoreProduct[]>): string[] {
    const { neutro } = carregarRankingCliques()
    const pontos = (cat: string) => porCategoria[cat].reduce((soma, p) => soma + Math.max(0, scoreClique(p, `loja:categoria:${cat}`) - neutro), 0)
    return Object.keys(porCategoria).sort((a, b) =>
        pontos(b) - pontos(a) || porCategoria[b].length - porCategoria[a].length || a.localeCompare(b))
}
