/**
 * Peças do JSON-LD `Person` de artista que valem teste próprio.
 *
 * Extraídas do JSX de ArtistDetailPage: lá ficam fora do alcance de teste, e as
 * duas resolvem lacunas medidas no Search Console (grafias do nome e filmografia).
 */
import { stripHtml } from '@/lib/utils'
import type { WPProduction } from '@/lib/wordpress/types'
import { grafiasAlternativas } from './grafias'

/** Hangul primeiro, depois as grafias romanizadas; sem duplicata e sem vazio. */
export function alternateNames(nome: string, hangul?: string | null, max = 6): string[] | undefined {
    const todas = [hangul?.trim(), ...grafiasAlternativas(nome, max)].filter((n): n is string => Boolean(n))
    const unicas = [...new Set(todas)]
    return unicas.length ? unicas : undefined
}

export interface ObraSchema {
    '@type': 'Movie' | 'TVSeries'
    name: string
    url: string
    datePublished?: string
}

function ano(p: WPProduction): number | null {
    const y = p.acf?.year ?? (p.acf?.release_date ? Number(String(p.acf.release_date).slice(0, 4)) : null)
    return y && y > 1900 ? y : null
}

/**
 * Obras em que a pessoa atua (`performerIn`), da mais recente para a mais antiga.
 * Limitado: o schema deve resumir a filmografia, não duplicar a tabela da página.
 */
export function performerIn(
    producoes: WPProduction[],
    urlDe: (slug: string) => string,
    max = 20,
): ObraSchema[] | undefined {
    const obras = [...producoes]
        .sort((a, b) => (ano(b) ?? 0) - (ano(a) ?? 0))
        .slice(0, max)
        .map((p): ObraSchema => {
            const y = ano(p)
            return {
                '@type': p.acf?.type === 'movie' ? 'Movie' : 'TVSeries',
                name: stripHtml(p.title.rendered),
                url: urlDe(p.slug),
                ...(y ? { datePublished: String(y) } : {}),
            }
        })
    return obras.length ? obras : undefined
}
