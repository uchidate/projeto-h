// Pontuacao de titulo e distancia de edicao, compartilhada pela busca via WP e pelo indice em memoria.

const COMBINING_DIACRITICS = /[̀-ͯ]/g

export function foldAccents(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(COMBINING_DIACRITICS, '')
        .trim()
}

export function stripSeparators(s: string): string {
    return foldAccents(s).replace(/[\s\-]+/g, '')
}

/**
 * Score de relevância do título contra a query, tolerante a variação de
 * espaço/hífen na romanização (ex: "Black Pink" ~ "BLACKPINK").
 * Retorna 0 quando não há match por substring (candidato a fuzzy fallback).
 */
export function scoreTitle(title: string, query: string): number {
    const titleFolded = foldAccents(title)
    const queryFolded = foldAccents(query)
    const titleTight = stripSeparators(title)
    const queryTight = stripSeparators(query)

    if (!titleTight.includes(queryTight)) return 0

    if (titleFolded === queryFolded || titleTight === queryTight) return 100
    if (titleFolded.startsWith(queryFolded) || titleTight.startsWith(queryTight)) return 80

    const words = titleFolded.split(/[\s\-]+/)
    if (words.includes(queryFolded)) return 70
    if (words.some(w => w.startsWith(queryFolded))) return 50

    return 20
}

export function levenshtein(a: string, b: string): number {
    const m = a.length
    const n = b.length
    if (m === 0) return n
    if (n === 0) return m

    let prev = Array.from({ length: n + 1 }, (_, i) => i)
    for (let i = 1; i <= m; i++) {
        const curr = [i]
        for (let j = 1; j <= n; j++) {
            curr[j] = a[i - 1] === b[j - 1]
                ? prev[j - 1]
                : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1])
        }
        prev = curr
    }
    return prev[n]
}

/** Menor distância entre a query e o título inteiro ou qualquer palavra do título. */
export function fuzzyDistance(title: string, query: string): number {
    const queryFolded = foldAccents(query)
    const candidates = [stripSeparators(title), ...foldAccents(title).split(/[\s\-]+/).filter(Boolean)]
    return Math.min(...candidates.map(c => levenshtein(c, queryFolded)))
}

export function fuzzyThreshold(query: string): number {
    return Math.max(1, Math.ceil(foldAccents(query).length * 0.34))
}

