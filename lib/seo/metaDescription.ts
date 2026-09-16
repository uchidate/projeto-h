/**
 * Descrição para <meta name="description"> e JSON-LD a partir de texto livre.
 *
 * O corte bruto `.slice(0, 160)` terminava no meio da palavra ("K-Dramas da",
 * "padrão narra") e preservava a quebra de linha e o "…" que o WordPress põe no
 * fim do excerpt. Aqui: junta espaços, remove reticências finais e corta no
 * último limite de palavra, fechando a frase quando ela cabe inteira.
 */
export function metaDescription(text: string, max = 160): string {
    const clean = text.replace(/\s+/g, ' ').replace(/\s*(\[&hellip;\]|\[…\]|…|\.\.\.)\s*$/, '').trim()
    if (clean.length <= max) return clean

    const cut = clean.slice(0, max)
    // Frase inteira que caiba no limite vale mais que meia frase cortada.
    const lastSentence = cut.match(/^(.*[.!?])\s/)
    if (lastSentence && lastSentence[1].length >= max * 0.6) return lastSentence[1]

    const lastSpace = cut.lastIndexOf(' ')
    const base = (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:—–-]+$/, '')
    return `${base}…`
}
