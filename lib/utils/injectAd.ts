import { removeTags } from '@/lib/utils'

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
 * Onde é seguro cortar o HTML para cada `</p>`: a posição logo depois dele, ou, se
 * ele está dentro de um contêiner aberto, a posição logo depois do fechamento do
 * contêiner mais externo.
 *
 * Cortar o HTML do WordPress em qualquer `</p>` parte ao meio um `<div>` que abre
 * numa metade e fecha na outra (ex.: `<div class="hh-intro">` com os dois primeiros
 * parágrafos). Cada metade vai para um elemento próprio e o navegador "conserta" as
 * tags soltas de um jeito que o React não espera: a hidratação falha (React #418, em
 * TODAS as fichas de produção, medido em 2026-09-26) e a página é refeita no cliente a
 * cada visita. Em 150 produções, 30 dos 33 cortes com anúncio eram desse tipo.
 *
 * Recuar para "só cortes fora de contêiner" faria esses anúncios sumirem (e o
 * `production_content` é o slot que mais preenche). Adiar o corte para o fim do
 * contêiner mantém o anúncio no mesmo lugar visual: depois do trecho de abertura.
 * Há uma entrada por parágrafo (repetida quando vários dividem o mesmo contêiner),
 * para que "depois do N-ésimo parágrafo" continue querendo dizer o mesmo.
 *
 * Só conta contêiner de bloco; `<p>`, `<img>`, `<br>` e afins não abrem nada que
 * precise fechar. Tag auto-fechada (`<div />`) não abre. Conteúdo sem fechamento
 * (HTML desbalanceado) não gera corte.
 */
const CONTEINER = /<(\/?)(div|section|article|blockquote|ul|ol|table|figure|details|aside|main|header|footer|nav)\b[^>]*?(\/?)>/gi

export function posicoesDeCorte(html: string, fimDeParagrafo = '</p>'): number[] {
    // Fechamentos que zeram a profundidade, na ordem, e a profundidade ao longo do texto.
    const eventos: Array<{ fim: number; profundidade: number }> = []
    let profundidade = 0
    for (const m of html.matchAll(CONTEINER)) {
        if (m[3] === '/') continue
        profundidade += m[1] === '/' ? -1 : 1
        eventos.push({ fim: (m.index ?? 0) + m[0].length, profundidade })
    }

    const posicoes: number[] = []
    let cursor = 0
    let e = 0
    let atual = 0
    for (;;) {
        const idx = html.indexOf(fimDeParagrafo, cursor)
        if (idx === -1) break
        cursor = idx + fimDeParagrafo.length
        while (e < eventos.length && eventos[e].fim <= cursor) { atual = eventos[e].profundidade; e++ }
        if (atual <= 0) { posicoes.push(cursor); continue }
        // Dentro de um contêiner: o corte seguro é o fechamento que devolve a profundidade a zero.
        const fechamento = eventos.slice(e).find(ev => ev.profundidade <= 0)
        if (fechamento) posicoes.push(fechamento.fim)
    }
    return posicoes
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
    // Só cortes fora de contêineres abertos (ver `posicoesDeCorte`).
    const fins = posicoesDeCorte(html)
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

const stripTags = (html: string) => removeTags(html)

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

    const positions = posicoesDeCorte(html)

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
