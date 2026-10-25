import { stripHtml } from '@/lib/utils'

export interface FichaDoAlbum {
    rotulo: string
    valor: string
}

export interface FaixaDaCapa {
    /** Âncora da faixa no artigo (`faixa-1`). */
    id: string
    titulo: string
    /** `m:ss`, da tabela "Duração" do próprio artigo; ausente quando o texto não traz. */
    duracao?: string
    /** O artigo embute o clipe do YouTube dentro do trecho da faixa. */
    clipe?: boolean
}

export interface CapaAlbum {
    fichas: FichaDoAlbum[]
    faixas: FaixaDaCapa[]
}

const FAIXAS_MINIMAS = 3

function limpar(html: string) {
    return stripHtml(html).replace(/&quot;|["“”]/g, '').replace(/\s+/g, ' ').trim()
}

function chaveDoTitulo(titulo: string) {
    return limpar(titulo).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

/** Tabela "Duração" do artigo: linhas `título | m:ss | …`. Só entra o par com formato de duração. */
function duracoesDaTabela(html: string): Map<string, string> {
    const mapa = new Map<string, string>()
    for (const tabela of html.matchAll(/<table[\s\S]*?<\/table>/gi)) {
        if (!/dura[cç][aã]o/i.test(tabela[0])) continue
        for (const linha of tabela[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
            const celulas = [...linha[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c => limpar(c[1]))
            const duracao = celulas.find(c => /^\d{1,2}:\d{2}$/.test(c))
            if (celulas[0] && duracao) mapa.set(chaveDoTitulo(celulas[0]), duracao)
        }
    }
    return mapa
}

/**
 * Ficha e faixas de um artigo de álbum, lidas do próprio texto (bloco `oc-stats` e grupos `oc-track` com âncora).
 * Texto que não é de álbum (menos de três faixas) devolve null: a capa fica como a de qualquer matéria.
 */
export function extrairCapaAlbum(html: string | undefined | null): CapaAlbum | null {
    if (!html) return null
    const faixas: FaixaDaCapa[] = []
    const faixa = /<div[^>]*\bid="([^"]+)"[^>]*\bclass="[^"]*\boc-track\b[^"]*"[^>]*>[\s\S]*?<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi
    const achadas = [...html.matchAll(faixa)]
    const duracoes = duracoesDaTabela(html)
    achadas.forEach((m, i) => {
        const titulo = limpar(m[2]).replace(/^\d+\.\s*/, '')
        if (!titulo) return
        const trecho = html.slice(m.index, achadas[i + 1]?.index ?? html.length)
        const item: FaixaDaCapa = { id: m[1], titulo }
        const duracao = duracoes.get(chaveDoTitulo(titulo))
        if (duracao) item.duracao = duracao
        if (/<iframe[^>]+youtube(?:-nocookie)?\.com\/embed/i.test(trecho)) item.clipe = true
        faixas.push(item)
    })
    if (faixas.length < FAIXAS_MINIMAS) return null

    const fichas: FichaDoAlbum[] = []
    const stats = html.match(/<div[^>]*\boc-stats\b[^>]*>([\s\S]*?)<\/dl>/i)?.[1] ?? ''
    for (const m of stats.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)) {
        const rotulo = limpar(m[1])
        const valor = limpar(m[2])
        if (rotulo && valor) fichas.push({ rotulo, valor })
    }
    const billboard = html.match(/(\d{1,3})\s*[ºo°]\s+lugar\s+na\s+Billboard\s+200/i)
    if (billboard) fichas.push({ rotulo: 'Billboard 200', valor: `${billboard[1]}º` })
    return { fichas: fichas.slice(0, 4), faixas }
}
