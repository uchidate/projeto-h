import { stripHtml } from '@/lib/utils'

export interface FichaDoAlbum {
    rotulo: string
    valor: string
}

export interface FaixaDaCapa {
    /** Âncora da faixa no artigo (`faixa-1`). */
    id: string
    titulo: string
}

export interface CapaAlbum {
    fichas: FichaDoAlbum[]
    faixas: FaixaDaCapa[]
}

const FAIXAS_MINIMAS = 3

function limpar(html: string) {
    return stripHtml(html).replace(/&quot;|["“”]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Ficha e faixas de um artigo de álbum, lidas do próprio texto (bloco `oc-stats` e grupos `oc-track` com âncora).
 * Texto que não é de álbum (menos de três faixas) devolve null: a capa fica como a de qualquer matéria.
 */
export function extrairCapaAlbum(html: string | undefined | null): CapaAlbum | null {
    if (!html) return null
    const faixas: FaixaDaCapa[] = []
    const faixa = /<div[^>]*\bid="([^"]+)"[^>]*\bclass="[^"]*\boc-track\b[^"]*"[^>]*>[\s\S]*?<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi
    for (const m of html.matchAll(faixa)) {
        const titulo = limpar(m[2]).replace(/^\d+\.\s*/, '')
        if (titulo) faixas.push({ id: m[1], titulo })
    }
    if (faixas.length < FAIXAS_MINIMAS) return null

    const fichas: FichaDoAlbum[] = []
    const stats = html.match(/<div[^>]*\boc-stats\b[^>]*>([\s\S]*?)<\/dl>/i)?.[1] ?? ''
    for (const m of stats.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)) {
        const rotulo = limpar(m[1])
        const valor = limpar(m[2])
        if (rotulo && valor) fichas.push({ rotulo, valor })
    }
    return { fichas: fichas.slice(0, 4), faixas }
}
