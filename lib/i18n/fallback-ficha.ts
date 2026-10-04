import type { Metadata } from 'next'

/**
 * Metadados de uma página que existe em outro idioma só pela interface (D10 em
 * docs/I18N-V2.md): o corpo é o original em português, então fica fora do índice
 * e herda o canonical da versão original, que já vem em `base`.
 */
export function comoFallback(base: Metadata): Metadata {
    return { ...base, robots: { index: false, follow: true } }
}
