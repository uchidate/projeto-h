'use client'

import { useScrollDepth } from '@/hooks/useScrollDepth'

/**
 * `scroll_depth` para páginas que não são artigo.
 *
 * Até 2026-09-13 a profundidade de rolagem só era medida no blog
 * (RastreioDeLeitura), e as fichas de produção, artista e grupo — boa parte do
 * tráfego de busca — ficavam sem saber onde o visitante desiste. Mesmo hook,
 * mesmas regras de qualidade do dado; ver hooks/useScrollDepth.ts.
 */
export function RastreioDeRolagem({ caminho }: { caminho: string }) {
    useScrollDepth(caminho)
    return null
}
