import type { StoreProduct } from './store'

/**
 * Escolha de produtos por assunto da página, para quando não há grupo/artista ligado.
 * Função pura (sem node:fs): o CTR continua sendo aplicado depois por `ordenarPrateleira`.
 */
export type Tema = 'beleza' | 'culinaria' | 'musica' | 'drama'

const TEMAS: Record<Tema, { gatilhos: RegExp; categorias: string[] }> = {
    beleza:    { gatilhos: /\b(skincare|k-?beauty|beleza|pele|maquiagem|cosm[eé]tic|protetor solar|cabelo)\b/i, categorias: ['kbeauty'] },
    culinaria: { gatilhos: /\b(receita|culin[aá]ri|comida|lamen|ramyun|kimchi|tteokbokki|gastronomia|street food|snack)\b/i, categorias: ['snacks', 'alimenta'] },
    musica:    { gatilhos: /\b(comeback|[aá]lbum|lan[cç]amento|m[uú]sica|show|turn[eê]|lightstick|photocard|fandom|k-?pop)\b/i, categorias: ['kpop_album', 'lightstick', 'photocard'] },
    // Comida e beleza lideram os cliques em dorama; photocard e roupa de grupo só entram por palavra do título na página.
    drama:     { gatilhos: /\b(dorama|k-?drama|s[eé]rie|filme|elenco|atriz|ator|romance)\b/i, categorias: ['kdrama', 'snacks', 'alimenta', 'kbeauty', 'acessorios'] },
}

/** Temas de nicho único: a prateleira pode ser toda da mesma categoria. */
const TEMAS_ABERTOS = new Set<Tema>(['beleza', 'culinaria'])

const STOPWORDS = new Set([
    'para', 'com', 'sem', 'kit', 'original', 'oficial', 'coreano', 'coreana', 'kpop', 'k-pop', 'coreia',
    'unidades', 'cor', 'tipo', 'pele', 'facial', 'cada', 'mais', 'uma', 'dos', 'das', 'por',
])

function normalizar(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function detectarTemas(texto: string): Tema[] {
    return (Object.keys(TEMAS) as Tema[]).filter(t => TEMAS[t].gatilhos.test(texto))
}

/** Palavras do título do produto que dizem algo (marca, franquia, grupo) e aparecem no texto da página. */
function palavrasEmComum(produto: StoreProduct, textoNorm: string): number {
    const palavras = normalizar(produto.title.rendered.replace(/&[a-z#0-9]+;/gi, ' '))
        .split(/[^a-z0-9]+/)
        .filter(w => w.length >= 5 && !STOPWORDS.has(w))
    const unicas = new Set(palavras)
    let n = 0
    for (const w of unicas) if (textoNorm.includes(w)) n++
    return n
}

interface Opcoes {
    /** Título + resumo + categorias da página; serve para detectar temas e palavras em comum. */
    texto?: string
    /** Temas forçados (ex.: ['drama'] numa ficha de produção), somados aos detectados no texto. */
    temas?: Tema[]
    limite?: number
    excluirIds?: number[]
    /** Máximo por categoria quando não há tema claro, para a prateleira não virar monocultura. */
    maxPorCategoria?: number
}

/**
 * Pontua cada produto visível: palavra do título presente na página (+3 cada), categoria do tema (+2),
 * destaque (+1). Sem nenhum sinal, devolve [] — quem chama decide o fallback.
 */
export function escolherPorTema(produtos: StoreProduct[], opcoes: Opcoes = {}): StoreProduct[] {
    return escolherPorTemaComAderencia(produtos, opcoes).map(x => x.p)
}

/** Igual a `escolherPorTema`, mas devolve junto a aderência de cada produto ao texto (palavras em comum e tema, sem contar destaque). */
export function escolherPorTemaComAderencia(produtos: StoreProduct[], opcoes: Opcoes = {}): { p: StoreProduct; aderencia: number }[] {
    const { texto = '', limite = 8, excluirIds = [], maxPorCategoria = 3 } = opcoes
    const temas = [...new Set([...(opcoes.temas ?? []), ...detectarTemas(texto)])]
    const categoriasDoTema = new Set(temas.flatMap(t => TEMAS[t].categorias))
    const textoNorm = normalizar(texto)
    const excluidos = new Set(excluirIds)

    const pontuados = produtos
        .filter(p => !p.acf.is_hidden && !excluidos.has(p.id) && p.acf.affiliate_url && p.acf.image_url && p.acf.price)
        .map(p => {
            const comum = palavrasEmComum(p, textoNorm)
            const tema = categoriasDoTema.has(p.acf.category ?? '') ? 1 : 0
            return { p, aderencia: comum * 3 + tema * 2, score: comum * 3 + tema * 2 + (p.acf.featured ? 1 : 0), sinal: comum > 0 || tema > 0 }
        })
        .filter(x => x.sinal)
        .sort((a, b) => b.score - a.score || (a.p.acf.position ?? 999) - (b.p.acf.position ?? 999))

    const porCategoria = new Map<string, number>()
    const escolhidos: { p: StoreProduct; aderencia: number }[] = []
    for (const { p, aderencia } of pontuados) {
        const cat = p.acf.category ?? 'outros'
        const usados = porCategoria.get(cat) ?? 0
        // Um tema só (ex.: beleza) pode encher a prateleira; vários temas ou nenhum, não.
        if (!(temas.length === 1 && TEMAS_ABERTOS.has(temas[0])) && usados >= maxPorCategoria) continue
        porCategoria.set(cat, usados + 1)
        escolhidos.push({ p, aderencia })
        if (escolhidos.length >= limite) break
    }
    return escolhidos
}
