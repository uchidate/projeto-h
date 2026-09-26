/** Cores das torcidas: escolha de tinta legível e contorno para cores quase pretas. */
export function luminancia(cor: string): number {
    const m = /^#?([0-9a-f]{6})$/i.exec(cor.trim())
    if (!m) return 0.7
    const n = parseInt(m[1], 16)
    return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
}

/** Tinta legível sobre a cor da torcida (escura sobre cor clara, branca sobre cor escura). */
export function tinta(cor: string): string { return luminancia(cor) > 0.55 ? '#15102b' : '#ffffff' }

/** Cor quase preta some no fundo escuro da página: ganha um contorno claro. */
export function contorno(cor: string): string { return luminancia(cor) < 0.15 ? 'outline outline-2 -outline-offset-2 outline-white/40' : '' }
