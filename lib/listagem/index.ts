import type { Metadata } from 'next'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'

/**
 * Peças comuns das listagens (artists, groups, productions, blog): número da
 * página, URL canônica, links prev/next e robots. Cada listagem tinha a sua
 * cópia; a regra de paginação e de noindex agora mora num lugar só.
 */

export type ParamsListagem = Record<string, string | undefined>

/** `?page=` como número ≥ 1; lixo ou ausência = página 1. */
export function paginaDe(valor?: string): number {
    return Math.max(1, parseInt(valor ?? '1', 10) || 1)
}

/**
 * URL pública da listagem. Só as `chaves` entram, na ordem dada (a ordem é parte
 * da URL canônica); `page` vai por último e some na página 1.
 */
export function urlDaListagem(
    caminho: string,
    chaves: readonly string[],
    sp: ParamsListagem,
    origem: string = SITE_URL,
): string {
    const ps = new URLSearchParams()
    for (const chave of chaves) {
        const valor = sp[chave]
        if (valor) ps.set(chave, valor)
    }
    if (sp.page && sp.page !== '1') ps.set('page', sp.page)
    return `${origem}${caminho}${ps.toString() ? `?${ps}` : ''}`
}

/** Página além do fim: a URL existe, mas não deve ser indexada. */
export function paginaInvalida(page: number, totalPages: number): boolean {
    return page > Math.max(1, totalPages)
}

/** `rel=prev/next` da paginação. `ativa: false` desliga (ex.: canonical aponta para outra página). */
export function linksDePaginacao(opts: {
    page: number
    totalPages: number
    urlDaPagina: (pagina: number) => string
    ativa?: boolean
}): { prev?: string; next?: string } {
    if (opts.ativa === false) return {}
    return {
        ...(opts.page > 1 ? { prev: opts.urlDaPagina(opts.page - 1) } : {}),
        ...(opts.page < opts.totalPages ? { next: opts.urlDaPagina(opts.page + 1) } : {}),
    }
}

/** `robots` de listagem filtrada ou fora do intervalo: segue os links, não indexa. */
export function robotsDaListagem(naoIndexar: boolean): { robots?: { index: false; follow: true } } {
    return naoIndexar ? { robots: { index: false, follow: true } } : {}
}

/**
 * Metadados de uma listagem paginada com filtros, no lugar da cópia que artistas, grupos, produções e
 * comidas tinham: canonical, `prev/next`, hreflang só na página 1 sem filtro, noindex em filtro ou página
 * além do fim, Open Graph e Twitter. Quem chama resolve título, descrição e a URL de cada página.
 */
export async function metadataDeListagem(opts: {
    titulo: string
    descricao: string
    url: string
    page: number
    totalPages: number
    /** Havia filtro, busca ou ordenação na URL: não indexa. */
    temFiltro: boolean
    urlDaPagina: (pagina: number) => string
    /** `false` quando o canonical aponta para outra página (ex.: hub estático). */
    paginacaoAtiva?: boolean
    /** hreflang da listagem; só é chamada na página 1 sem filtro. */
    idiomas?: () => Promise<Record<string, string> | undefined>
}): Promise<Metadata> {
    const languages = opts.page === 1 && !opts.temFiltro ? await opts.idiomas?.() : undefined
    return {
        title: opts.titulo,
        description: opts.descricao,
        alternates: {
            canonical: opts.url,
            ...(languages ? { languages } : {}),
            ...linksDePaginacao({ page: opts.page, totalPages: opts.totalPages, ativa: opts.paginacaoAtiva, urlDaPagina: opts.urlDaPagina }),
        },
        ...robotsDaListagem(opts.temFiltro || paginaInvalida(opts.page, opts.totalPages)),
        openGraph: baseOG(opts.url),
        twitter: baseTwitter(),
    }
}
