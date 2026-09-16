/** Cor de destaque padrão quando o valor do ACF não é um hex utilizável. */
export const DEFAULT_ACCENT = '#e91e8c'

const FALLBACK_RGB = '233,30,140' // DEFAULT_ACCENT em componentes

/**
 * Converte o hex de destaque (ACF `color`) em rgba para uso em CSS inline.
 *
 * Existia em 12 componentes: 11 com a versão ingênua, que faz
 * `parseInt(h.slice(0,2), 16)` sobre um hex de 3 dígitos e devolve
 * `rgba(NaN,NaN,NaN,α)` — declaração inválida, a cor simplesmente some. Esta é a
 * variante que já tratava 3 dígitos e entrada inválida.
 */
export function toRgba(hex: string, alpha: number): string {
    const normalized = (hex ?? '').replace('#', '').trim()
    const value = normalized.length === 3
        ? normalized.split('').map(char => char + char).join('')
        : normalized
    const parsed = Number.parseInt(value, 16)
    if (!Number.isFinite(parsed) || value.length !== 6) return `rgba(${FALLBACK_RGB},${alpha})`
    return `rgba(${(parsed >> 16) & 255},${(parsed >> 8) & 255},${parsed & 255},${alpha})`
}
