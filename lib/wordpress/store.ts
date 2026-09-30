import { readFileSync } from 'node:fs'
import path from 'node:path'
import { wpFetchWithTotal } from './client'
import { WP_CACHE_TAGS } from './cache'

export type StoreProduct = {
    id: number
    title: { rendered: string }
    date_gmt: string
    acf: {
        price: string | null
        original_price: string | null
        image_url: string | null
        affiliate_url: string | null
        store: string | null          // shopee | amazon | mercadolivre | magalu | shein | outro
        category: string | null       // kpop_album | lightstick | kbeauty | kdrama | clothing | acessorios | photocard | snacks | outros
        badge: string | null
        rating: number | null
        sold_count: string | null
        featured: boolean | null
        is_hidden: boolean | null
        position: number | null
        related_group: number | null
        related_artist: number | null
        price_history: { date: string; price: string }[] | null
    }
}

/** Calcula o desconto real a partir dos dois preços já gravados — nunca inventa percentual. */
export function calcularDesconto(price?: string | null, originalPrice?: string | null): number | null {
    if (!price || !originalPrice) return null
    const parse = (s: string) => Number(s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'))
    const atual = parse(price)
    const original = parse(originalPrice)
    if (!Number.isFinite(atual) || !Number.isFinite(original) || original <= atual) return null
    return Math.round(((original - atual) / original) * 100)
}

/**
 * true só quando o preço atual é, de fato, o menor registrado no histórico
 * dentro da janela — nunca aproxima nem assume na ausência de dado.
 * Exige pelo menos 2 leituras no histórico (senão não há "histórico" real).
 */
export function ehMenorPrecoEmDias(price: string | null, history: { date: string; price: string }[] | null, dias = 30): boolean {
    if (!price || !history || history.length < 2) return false
    const parse = (s: string) => Number(s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'))
    const atual = parse(price)
    if (!Number.isFinite(atual)) return false
    const limite = Date.now() - dias * 24 * 60 * 60 * 1000
    const janela = history.filter(h => new Date(h.date).getTime() >= limite)
    if (janela.length < 2) return false
    const menor = Math.min(...janela.map(h => parse(h.price)).filter(Number.isFinite))
    return Number.isFinite(menor) && atual <= menor
}

/** Data real de publicação do post — nunca "novo" fabricado. */
export function ehNovo(dateGmt: string, dias = 14): boolean {
    const publicado = new Date(`${dateGmt}Z`).getTime()
    if (!Number.isFinite(publicado)) return false
    return Date.now() - publicado <= dias * 24 * 60 * 60 * 1000
}

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

export const STORE_LABELS: Record<string, string> = {
    shopee:       'Shopee',
    amazon:       'Amazon',
    mercadolivre: 'Mercado Livre',
    magalu:       'Magalu',
    shein:        'Shein',
    outro:        'Parceiros',
}

export const CATEGORY_LABELS: Record<string, string> = {
    kpop_album:  'Álbuns K-Pop',
    lightstick:  'Lightsticks',
    kbeauty:     'K-Beauty',
    kdrama:      'K-Drama',
    clothing:    'Moda',
    acessorios:  'Acessórios',
    photocard:   'Photocards',
    snacks:      'Snacks',
    alimenta:    'Comida Coreana', // valor gravado por engano no lugar de "snacks" nos produtos importados
    outros:      'Outros',
}

export function formatCategory(category: string): string {
    return CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ')
}

export async function getStoreProducts(): Promise<StoreProduct[]> {
    const opts = { revalidate: 300, tags: [WP_CACHE_TAGS.storeProducts] }
    const first = await wpFetchWithTotal<StoreProduct>(
        '/wp/v2/store_products?per_page=100&page=1&orderby=id&order=asc&status=publish',
        opts,
    )
    if (!Array.isArray(first.items)) return []
    const items = [...first.items]
    for (let page = 2; page <= first.totalPages; page++) {
        const next = await wpFetchWithTotal<StoreProduct>(
            `/wp/v2/store_products?per_page=100&page=${page}&orderby=id&order=asc&status=publish`,
            opts,
        )
        items.push(...next.items)
    }
    return items
}

export async function getStoreProductsByGroupId(groupId: number): Promise<StoreProduct[]> {
    const products = await getStoreProducts()
    return products.filter(p => !p.acf.is_hidden && p.acf.related_group === groupId)
}

export async function getStoreProductsByArtistId(artistId: number): Promise<StoreProduct[]> {
    const products = await getStoreProducts()
    return products.filter(p => !p.acf.is_hidden && p.acf.related_artist === artistId)
}

export async function getFeaturedStoreProducts(limit = 5): Promise<StoreProduct[]> {
    const products = await getStoreProducts()
    return products.filter(p => !p.acf.is_hidden && p.acf.featured).slice(0, limit)
}
