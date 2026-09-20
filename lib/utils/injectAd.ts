/**
 * Tamanho do texto visível de um trecho de HTML — equivalente a
 * `strip_tags(...).trim().length`, sem construir a string intermediária.
 *
 * Um `replace(/<[^>]*>/g, '')` faria o mesmo em uma linha, mas o CodeQL o
 * classifica como sanitização incompleta (js/incomplete-multi-character-
 * sanitization), e com razão para quem renderiza o resultado. Aqui o valor é só
 * medida de tamanho e nunca chega ao DOM; o varredor explícito deixa a intenção
 * clara e não se parece com sanitização.
 */
export function textoVisivel(html: string): number {
    let total = 0
    let espacosPendentes = 0
    let comecou = false
    let dentroDeTag = false
    for (const ch of html) {
        if (ch === '<') { dentroDeTag = true; continue }
        if (ch === '>') { dentroDeTag = false; continue }
        if (dentroDeTag) continue
        if (!ch.trim()) { if (comecou) espacosPendentes++; continue }
        comecou = true
        total += espacosPendentes + 1
        espacosPendentes = 0
    }
    return total
}

/**
 * Divide o HTML do WordPress em duas partes para inserir um ad
 * após o N-ésimo parágrafo sem manipular o DOM via JS (SSR-safe).
 *
 * O corte é ADAPTATIVO: se a ficha não tem N parágrafos, recua para o último
 * corte possível em vez de desistir. Medido em 2026-09-19: com corte fixo,
 * 65% das fichas de artista, 43% das produções e 96% dos grupos nunca
 * renderizavam o anúncio do corpo, porque o texto é mais curto que o corte.
 *
 * O piso é de CONTEÚDO, não de contagem de parágrafos: o que sobra depois do
 * corte precisa ter `minTailChars` de texto real. É o mesmo critério de
 * `splitContentForAds`, e é ele que protege o caso que a regra antiga queria
 * proteger — anúncio colado no fim de uma ficha de uma frase.
 *
 * Retorna [antes, depois] ou [todo, ''] quando não há cauda suficiente.
 */
export function splitContentForAd(html: string, afterParagraph = 2, minTailChars = 400, adaptativo = true): [string, string] {
    // Usa regex simples — o conteúdo já vem sanitizado pelo WP
    const paragraphEnd = '</p>'

    // Todas as posições de fim de parágrafo, para poder recuar.
    const fins: number[] = []
    let cursor = 0
    for (;;) {
        const idx = html.indexOf(paragraphEnd, cursor)
        if (idx === -1) break
        cursor = idx + paragraphEnd.length
        fins.push(cursor)
    }
    if (fins.length < 2) return [html, '']

    // Do corte pedido para trás: o primeiro que deixa cauda suficiente vence.
    // Nunca corta no último parágrafo — aí não sobraria nada depois.
    // `adaptativo: false` preserva o comportamento antigo (ou corta no parágrafo
    // pedido, ou não corta). Usado onde a cauda vai para um "continuar lendo":
    // recuar o corte esconderia atrás de um clique conteúdo que hoje está visível.
    const inicio = adaptativo ? Math.min(afterParagraph, fins.length - 1) : afterParagraph
    if (inicio > fins.length - 1) return [html, '']
    for (let n = inicio; n >= (adaptativo ? 1 : inicio); n--) {
        const pos = fins[n - 1]
        if (textoVisivel(html.slice(pos)) >= minTailChars) return [html.slice(0, pos), html.slice(pos)]
    }

    return [html, '']
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
