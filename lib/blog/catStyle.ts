import { readingTime } from '@/lib/utils'

// Cores de texto ajustadas em 2026-07-06 pra passar WCAG AA (4.5:1) — a
// paleta original falhava em 7 das 9 categorias (achado via axe-core,
// pior caso 'noticias' com só 2.91:1). Mesmo fundo/matiz, texto mais escuro.
const CAT_PALETTE: Record<string, { bg: string; color: string }> = {
    'k-pop':    { bg: '#fff0f5', color: '#cf1479' },
    'k-drama':  { bg: '#f0f4ff', color: '#3b5bdb' },
    'cultura':  { bg: '#f4f0ff', color: '#754bf1' },
    'noticias': { bg: '#fff9f0', color: '#bb4e05' },
    'musica':   { bg: '#f0fff4', color: '#268238' },
    'cinema':   { bg: '#fff3f3', color: '#d72020' },
    'grupos':   { bg: '#f0fffe', color: '#0b7c8f' },
    'artistas': { bg: '#fefef0', color: '#ad5f0a' },
    'guias':    { bg: '#f5f0ff', color: '#9c36b5' },
}

export function catStyle(slug?: string): { bg: string; color: string } {
    if (slug && CAT_PALETTE[slug]) return CAT_PALETTE[slug]
    if (slug) {
        let h = 0
        for (let i = 0; i < slug.length; i++) h = slug.charCodeAt(i) + ((h << 5) - h)
        const hue = Math.abs(h) % 360
        // l=28% (não 38%) — testado contra todos os hues em incrementos de 5°,
        // pior caso passa com margem (5.10:1); 38% falhava em vários hues (2.98:1).
        return { bg: `hsl(${hue},60%,96%)`, color: `hsl(${hue},55%,28%)` }
    }
    return { bg: '#f5f5f5', color: '#555' }
}

/**
 * Mesma paleta de `catStyle`, mas por tema: o fundo pastel claro virava um bloco de cor
 * estranho no tema escuro (etiquetas "GUIA K-POP" e "WEBTOON" do artigo). `light-dark()`
 * escolhe pelo `color-scheme` da página (`.dark` define `color-scheme: dark`): no claro é o
 * par de `catStyle`; no escuro o fundo é a própria cor translúcida e o texto, a cor clareada.
 */
export function catStyleTema(slug?: string): { bg: string; color: string } {
    const claro = catStyle(slug)
    if (slug && CAT_PALETTE[slug]) {
        return {
            bg: `light-dark(${claro.bg}, color-mix(in srgb, ${claro.color} 20%, transparent))`,
            color: `light-dark(${claro.color}, color-mix(in srgb, ${claro.color} 45%, white))`,
        }
    }
    if (slug) {
        let h = 0
        for (let i = 0; i < slug.length; i++) h = slug.charCodeAt(i) + ((h << 5) - h)
        const hue = Math.abs(h) % 360
        return {
            bg: `light-dark(${claro.bg}, hsl(${hue} 60% 50% / 0.18))`,
            color: `light-dark(${claro.color}, hsl(${hue} 65% 78%))`,
        }
    }
    return { bg: 'light-dark(#f5f5f5, rgb(255 255 255 / 0.1))', color: 'light-dark(#555, #c9c4d0)' }
}

export function isRecent(dateStr: string) {
    return Date.now() - new Date(dateStr).getTime() < 7 * 24 * 60 * 60 * 1000
}

/**
 * Tempo de leitura de um post da listagem, ou null quando não dá para saber.
 *
 * Existia duplicado e divergente: o card fazia `acf.reading_time ?? readingTime(content)`,
 * enquanto a barra lateral fazia só `readingTime(post.content ?? '')`. Como
 * `getSidebarPosts` nem pede `content` no `_fields`, o argumento era sempre
 * string vazia e `readingTime` devolvia o piso de 1 — a lateral anunciava
 * "1 min" para todo post do site, inclusive para os mesmos posts que a grade
 * ao lado marcava como 3 min. O `acf` vinha na resposta e era ignorado.
 *
 * Devolver null em vez de um número inventado é o ponto: sem dado, o rótulo
 * some, em vez de afirmar algo falso ao leitor.
 */
export function postReadingTime(post: { acf?: { reading_time?: number } | null; content?: { rendered?: string } }): number | null {
    const authored = post.acf?.reading_time
    if (typeof authored === 'number' && authored > 0) return authored
    const html = post.content?.rendered
    if (!html) return null
    return readingTime(html)
}
