/**
 * Onde a pessoa estava na lista de artistas quando abriu uma ficha: a ficha usa isto para
 * oferecer "anterior" e "próximo" na mesma ordem e no mesmo filtro. Fica na sessão da aba.
 */
export interface ItemLista { slug: string; nome: string; foto: string | null; papel: string | null }

export interface ContextoLista {
    /** Endereço da lista (com filtro, ordem e página) para o "Voltar à lista". */
    href: string
    /** Texto curto do recorte, como "Em alta" ou "Em alta · Cantores". */
    rotulo: string
    /** Posição do primeiro item da página no total (1 = primeiro). */
    inicio: number
    total: number
    itens: ItemLista[]
}

export interface Vizinhanca {
    posicao: number
    total: number
    href: string
    rotulo: string
    anterior: ItemLista | null
    proximo: ItemLista | null
}

export const CHAVE_LISTA = 'hh:lista:v1'

export function salvarContexto(ctx: ContextoLista): void {
    try { window.sessionStorage.setItem(CHAVE_LISTA, JSON.stringify(ctx)) } catch { /* sem sessão: sem navegação na lista */ }
}

/** Texto cru salvo (ou vazio): estável entre leituras, para servir de snapshot ao React. */
export function lerContextoCru(): string {
    try { return window.sessionStorage.getItem(CHAVE_LISTA) ?? '' } catch { return '' }
}

export function interpretarContexto(cru: string): ContextoLista | null {
    try {
        if (!cru) return null
        const c = JSON.parse(cru)
        return c && Array.isArray(c.itens) && typeof c.href === 'string' ? c as ContextoLista : null
    } catch { return null }
}

export function lerContexto(): ContextoLista | null {
    return interpretarContexto(lerContextoCru())
}

/** Vizinhos do artista na lista salva; nulo quando ele não está nela. Nas pontas da página não há vizinho do outro lado. */
export function vizinhos(ctx: ContextoLista | null, slug: string): Vizinhanca | null {
    if (!ctx) return null
    const i = ctx.itens.findIndex(x => x.slug === slug)
    if (i < 0) return null
    return {
        posicao: ctx.inicio + i, total: ctx.total, href: ctx.href, rotulo: ctx.rotulo,
        anterior: i > 0 ? ctx.itens[i - 1] : null,
        proximo: i < ctx.itens.length - 1 ? ctx.itens[i + 1] : null,
    }
}
