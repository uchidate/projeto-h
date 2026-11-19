import type { StoreProduct } from '@/lib/wordpress/store'

/** Por que o produto está na prateleira da ficha: vira o selo do cartão. */
export type MotivoPrateleira = 'na-obra' | 'elenco' | 'maratona'

export const ROTULO_MOTIVO: Record<MotivoPrateleira, string> = {
    'na-obra': 'Aparece na obra',
    elenco: 'Do elenco',
    maratona: 'Para maratonar',
}

/** Categorias da reserva: comida e petisco têm o maior clique por produto da loja (Umami, 60 dias até 2026-11-18). */
export const CATEGORIAS_MARATONA = ['alimenta', 'snacks'] as const

export interface PrateleiraDaObra {
    produtos: StoreProduct[]
    motivos: Record<number, MotivoPrateleira>
}

/**
 * Junta as três fontes na ordem do vínculo com a obra: o que aparece nela (comida da ficha, produto com
 * o título da obra), o elenco e, para completar, comida e petisco. Antes a reserva era K-beauty e merch
 * casado por palavra solta, sob o título "Para quem curte X" (ex.: kit de grupo de K-pop numa série).
 * Sem repetição; cada produto guarda o primeiro motivo em que entrou.
 */
export function montarPrateleiraDaObra(
    fontes: { naObra: StoreProduct[]; elenco: StoreProduct[]; maratona: StoreProduct[] },
    limit = 6,
): PrateleiraDaObra {
    const produtos: StoreProduct[] = []
    const motivos: Record<number, MotivoPrateleira> = {}
    const ordem: [MotivoPrateleira, StoreProduct[]][] = [['na-obra', fontes.naObra], ['elenco', fontes.elenco], ['maratona', fontes.maratona]]
    for (const [motivo, lista] of ordem) {
        for (const p of lista) {
            if (produtos.length >= limit) break
            if (p.id in motivos || !p.acf.affiliate_url || p.acf.is_hidden) continue
            motivos[p.id] = motivo
            produtos.push(p)
        }
    }
    return { produtos, motivos }
}

const FAMILIAS: [string, RegExp][] = [
    ['lamen', /l[aá]m[eé]n|ramen|ramyun|ramyeon|noodle|macarr[aã]o|buldak|chapag|udon|jjajang/i],
    ['doce', /biscoito|pepero|choco ?pie|bolacha|chocolate|bala|doce|wafer|honey ?butter/i],
    ['salgadinho', /salgadinho|snack|chips|batata|koony|algas? (crocante|temperada)|nori/i],
    ['tempero', /gochujang|doenjang|pasta de pimenta|molho|kimchi|tempero|gochugaru|[oó]leo de gergelim/i],
    ['bebida', /bebida|ch[aá] |suco|soju|makgeolli|leite de banana|refrigerante/i],
]

/** Tipo de comida pelo título: as categorias da loja juntam lámen, doce e tempero no mesmo balaio. */
export function familiaDePetisco(p: StoreProduct): string {
    const titulo = p.title.rendered
    return FAMILIAS.find(([, re]) => re.test(titulo))?.[0] ?? p.acf.category ?? 'outros'
}

/** Alterna os tipos mantendo a ordem de cada um: lámen, doce, tempero… em vez de três lámens seguidos. */
export function alternarFamilias(produtos: StoreProduct[]): StoreProduct[] {
    const grupos = new Map<string, StoreProduct[]>()
    for (const p of produtos) {
        const f = familiaDePetisco(p)
        grupos.set(f, [...(grupos.get(f) ?? []), p])
    }
    const filas = [...grupos.values()]
    const saida: StoreProduct[] = []
    for (let i = 0; saida.length < produtos.length; i++) for (const fila of filas) if (i < fila.length) saida.push(fila[i])
    return saida
}

/**
 * Título que diz a verdade sobre o que está à vista (os três primeiros). Só um motivo: o título é ele.
 * Mistura: "Para maratonar", e o selo do cartão conta o vínculo de cada um.
 */
export function tituloPrateleira(obra: string, motivosVisiveis: (MotivoPrateleira | undefined)[]): string {
    const unicos = new Set(motivosVisiveis.filter(Boolean))
    if (unicos.size === 1 && unicos.has('na-obra')) return `Visto em ${obra}`
    if (unicos.size === 1 && unicos.has('elenco')) return `Do elenco de ${obra}`
    return `Para maratonar ${obra}`
}

/** Produto que leva o nome da obra no título (OST, livro, merch oficial). Nome curto demais casa por acaso. */
export function citaAObra(produto: StoreProduct, tituloObra: string): boolean {
    const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9가-힣]+/g, ' ').trim()
    const obra = normalizar(tituloObra)
    if (obra.length < 6) return false
    return ` ${normalizar(produto.title.rendered)} `.includes(` ${obra} `)
}
