/**
 * Divide o HTML do WordPress em duas partes para inserir um ad
 * após o N-ésimo parágrafo sem manipular o DOM via JS (SSR-safe).
 *
 * Retorna [antes, depois] ou [todo, ''] se não houver parágrafos suficientes.
 */
export function splitContentForAd(html: string, afterParagraph = 2): [string, string] {
    // Usa regex simples — o conteúdo já vem sanitizado pelo WP
    const paragraphEnd = '</p>'
    let count = 0
    let pos = 0

    while (count < afterParagraph) {
        const idx = html.indexOf(paragraphEnd, pos)
        if (idx === -1) return [html, '']
        pos = idx + paragraphEnd.length
        count++
    }

    return [html.slice(0, pos), html.slice(pos)]
}

interface AdBreakpointsOptions {
    /** Parágrafos mínimos no artigo para receber qualquer anúncio no corpo */
    minParagraphs?: number
    /** Intervalo de parágrafos entre anúncios consecutivos */
    everyParagraphs?: number
    /** Número máximo de anúncios inseridos no corpo do artigo */
    maxAds?: number
    /** Texto mínimo (chars, sem tags) entre dois anúncios consecutivos e antes do 1º */
    minCharsBetweenAds?: number
    /** Texto mínimo (chars) restante depois do último anúncio */
    minTailChars?: number
}

const stripTags = (html: string) => html.replace(/<[^>]*>/g, '')

/**
 * Divide o HTML em N+1 segmentos, um por ponto de inserção de anúncio
 * (padrão usado por plugins como Ad Inserter/Advanced Ads: densidade
 * proporcional ao tamanho do artigo, nunca um anúncio fixo único).
 *
 * Contar SÓ parágrafos não basta: matéria de notícia tem parágrafos de uma
 * frase, e "a cada 4 parágrafos" virava anúncios visualmente empilhados com
 * duas linhas de texto entre eles (reportado ao vivo em 2026-07-12). Um
 * breakpoint agora exige também `minCharsBetweenAds` de TEXTO real desde o
 * anúncio anterior (e desde o início), e `minTailChars` depois do último —
 * anúncio nunca aparece sem uma tela de conteúdo entre um e outro.
 */
export function splitContentForAds(html: string, options: AdBreakpointsOptions = {}): string[] {
    const {
        minParagraphs = 6, everyParagraphs = 4, maxAds = 3,
        minCharsBetweenAds = 800, minTailChars = 400,
    } = options

    const positions: number[] = []
    let pos = 0
    while (true) {
        const idx = html.indexOf('</p>', pos)
        if (idx === -1) break
        pos = idx + '</p>'.length
        positions.push(pos)
    }

    if (positions.length < minParagraphs) return [html]

    const breakpoints: number[] = []
    let lastBreak = 0
    let paragraphsSinceBreak = 0
    for (const point of positions) {
        if (breakpoints.length >= maxAds) break
        paragraphsSinceBreak++
        if (paragraphsSinceBreak < everyParagraphs) continue
        // Distância em texto real desde o último anúncio (ou início)
        if (stripTags(html.slice(lastBreak, point)).length < minCharsBetweenAds) continue
        // Evita quebrar logo antes de um heading — mantém o título junto do próximo bloco
        const nextChunk = html.slice(point, point + 80).trimStart()
        if (/^<h[2-4]/i.test(nextChunk)) continue
        // Não deixa anúncio "pendurado" no fim: precisa sobrar conteúdo depois
        if (stripTags(html.slice(point)).length < minTailChars) break
        breakpoints.push(point)
        lastBreak = point
        paragraphsSinceBreak = 0
    }

    if (breakpoints.length === 0) return [html]

    const segments: string[] = []
    let start = 0
    for (const bp of breakpoints) {
        segments.push(html.slice(start, bp))
        start = bp
    }
    segments.push(html.slice(start))
    return segments
}
