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

type RankingCliques = {
    global: Record<string, number>
    porContexto: Record<string, Record<string, number>>
}

/**
 * data/click-ranking.json é gerado offline (script `gerar-ranking-cliques.mjs`
 * do repo .operacao, que consulta o Umami) — o Next.js só lê. Lido uma vez por
 * processo; sem o arquivo (ainda não rodou, ou zero cliques), o ranking fica
 * vazio e a ordenação cai nos critérios de sempre, sem quebrar nada.
 */
let rankingCliques: RankingCliques | null = null
function carregarRankingCliques(): RankingCliques {
    if (rankingCliques) return rankingCliques
    try {
        const bruto = readFileSync(path.join(process.cwd(), 'data/click-ranking.json'), 'utf-8')
        const json = JSON.parse(bruto)
        rankingCliques = { global: json.global ?? {}, porContexto: json.porContexto ?? {} }
    } catch {
        rankingCliques = { global: {}, porContexto: {} }
    }
    return rankingCliques
}

/** Score de cliques do produto: por contexto (mais específico) quando disponível, senão o global. */
function scoreClique(produto: StoreProduct, contexto?: string): number {
    const ranking = carregarRankingCliques()
    const porContexto = contexto ? ranking.porContexto[contexto]?.[produto.id] : undefined
    return porContexto ?? ranking.global[String(produto.id)] ?? 0
}

/**
 * Ordem de exibição dentro de uma prateleira: destaque > desconto > CTR
 * recente (Umami, via `data/click-ranking.json`) > posição manual.
 *
 * `contexto` deixa o CTR responder "o que converte NESTA vitrine" (ex.:
 * "artista:jisoo-kim") em vez de só popularidade geral — os dois produtos
 * podem ter fãs bem diferentes. Sem contexto, ou sem dado pro contexto pedido,
 * cai no score global do produto.
 */
export function ordenarPrateleira(produtos: StoreProduct[], contexto?: string): StoreProduct[] {
    return [...produtos].sort((a, b) => {
        const destaqueA = a.acf.featured ? 1 : 0
        const destaqueB = b.acf.featured ? 1 : 0
        if (destaqueA !== destaqueB) return destaqueB - destaqueA
        const descA = calcularDesconto(a.acf.price, a.acf.original_price) ?? -1
        const descB = calcularDesconto(b.acf.price, b.acf.original_price) ?? -1
        if (descA !== descB) return descB - descA
        const cliqueA = scoreClique(a, contexto)
        const cliqueB = scoreClique(b, contexto)
        if (cliqueA !== cliqueB) return cliqueB - cliqueA
        return (a.acf.position ?? 999) - (b.acf.position ?? 999)
    })
}
