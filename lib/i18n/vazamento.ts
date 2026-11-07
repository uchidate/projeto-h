/**
 * Detector de português vazado nas páginas em inglês.
 *
 * O resto de português em /en foi achado até aqui à mão (curl + olho): blocos de
 * ficha, títulos de quiz, rótulos de componente. Isto automatiza a pergunta "quantas linhas de
 * texto visível desta página parecem português?" para comparar com uma linha de base e acusar
 * REGRESSÃO — a página que tinha 0 e passou a ter 3.
 *
 * Heurística (sem biblioteca de idioma): uma linha é suspeita se tem til (ã/õ) ou ao menos duas
 * palavras funcionais do português distintas. Nome próprio e título de obra podem passar; por isso
 * o resultado é comparado com a linha de base por página, não com zero.
 */

const REMOVER = /<(script|style|svg|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi

// Sem "de": aparece em nome próprio e em inglês ("de facto").
const PALAVRAS_PT = new Set([
    'do', 'da', 'dos', 'das', 'que', 'para', 'com', 'uma', 'os', 'em', 'não', 'você', 'mais', 'por',
    'seu', 'sua', 'seus', 'suas', 'são', 'está', 'também', 'quando', 'onde', 'sobre', 'pelo', 'pela',
    'foi', 'ser', 'ainda', 'mas', 'como', 'ele', 'ela', 'nos', 'nas', 'ao', 'aos', 'até', 'entre',
    'é', 'na', 'qual', 'quais', 'minha', 'meu', 'toque', 'salvo', 'ver', 'tudo', 'nome', 'ano', 'anos',
])

const ENTIDADES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'", '&nbsp;': ' ' }

function decodificar(texto: string): string {
    return texto.replace(/&(?:amp|lt|gt|quot|nbsp|#x27|#39);/g, m => ENTIDADES[m] ?? m)
}

/** Linhas de texto visível: remove script/style/svg e tags, separa por elemento. */
export function extrairTextos(html: string): string[] {
    const limpo = html.replace(REMOVER, ' ')
    return [...limpo.matchAll(/>([^<>]{4,})</g)]
        .map(m => decodificar(m[1]).replace(/\s+/g, ' ').trim())
        .filter(t => t.length >= 4)
}

export function pareceEmPortugues(linha: string): boolean {
    if (/[ãõ]/i.test(linha)) return true
    const palavras = linha.toLowerCase().match(/[a-zçáàâãéêíóôõúü]+/g) ?? []
    const achadas = new Set(palavras.filter(p => PALAVRAS_PT.has(p)))
    return achadas.size >= 2
}

/** As linhas suspeitas (únicas, na ordem em que aparecem). */
export function linhasEmPortugues(html: string): string[] {
    return [...new Set(extrairTextos(html).filter(pareceEmPortugues))]
}

export type ResultadoDaPagina = { caminho: string; linhas: string[] }

export type Regressao = { caminho: string; antes: number; agora: number; novas: string[] }

/** Páginas com mais linhas suspeitas do que na linha de base (página nova entra com base 0). */
export function regressoes(agora: ResultadoDaPagina[], base: Record<string, number>): Regressao[] {
    return agora
        .filter(p => p.linhas.length > (base[p.caminho] ?? 0))
        .map(p => ({ caminho: p.caminho, antes: base[p.caminho] ?? 0, agora: p.linhas.length, novas: p.linhas }))
}
