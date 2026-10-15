const PALAVRAS_VAZIAS = new Set(['a', 'o', 'as', 'os', 'de', 'do', 'da', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas', 'um', 'uma', 'para', 'com', 'por', 'que'])

function palavras(titulo: string): Set<string> {
    return new Set(
        titulo
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .split(/[^a-z0-9]+/)
            .filter(p => p.length > 1 && !PALAVRAS_VAZIAS.has(p)),
    )
}

/**
 * Dois títulos que tratam do mesmo fato com palavras parecidas.
 *
 * Sugerir no meio da leitura um artigo que é o gêmeo do atual ("NCT 127 lança
 * Blingy…" ao lado de "NCT 127 lança BLINGY…") é pior que não sugerir. Mede a
 * sobreposição de palavras sobre o MENOR título: um título curto contido num
 * longo já conta como quase igual.
 */
export function tituloQuaseIgual(a: string, b: string, limite = 0.6): boolean {
    const pa = palavras(a)
    const pb = palavras(b)
    const menor = Math.min(pa.size, pb.size)
    if (menor < 3) return false
    let comuns = 0
    for (const p of pa) if (pb.has(p)) comuns++
    return comuns / menor >= limite
}
