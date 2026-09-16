/**
 * Primeira frase de um texto, para responder "quem é" no FAQ das fichas.
 *
 * O FAQPage vira resposta no JSON-LD; um texto genérico ("aparece no site
 * em um perfil...") ali não responde a busca. Null quando a frase é curta ou
 * longa demais para servir de resposta — o chamador cai no texto padrão.
 */
export function firstSentence(text: string): string | null {
    const clean = text.replace(/\s+/g, ' ').trim()
    const match = clean.match(/^(.{40,280}?[.!?])(\s|$)/)
    return match ? match[1] : null
}
