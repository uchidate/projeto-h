import { SOURCE_LOCALE, type Locale } from '@/lib/i18n/config'
import type { WPTerm } from '@/lib/wordpress/types'

/** Nome em inglês dos gêneros do catálogo, pelo slug da taxonomia `production_genre`. */
const GENEROS_EN: Record<string, string> = {
    acao: 'Action',
    animacao: 'Animation',
    comedia: 'Comedy',
    crime: 'Crime',
    documentario: 'Documentary',
    drama: 'Drama',
    fantasia: 'Fantasy',
    ficcao: 'Science Fiction',
    historico: 'Historical',
    misterio: 'Mystery',
    musical: 'Musical',
    romance: 'Romance',
    terror: 'Horror',
    thriller: 'Thriller',
    variedades: 'Variety',
}

/** Nome de um gênero no idioma; sem tradução conhecida, mantém o nome do WordPress. */
export function nomeDoGenero(slug: string, nome: string, locale: Locale): string {
    if (locale === SOURCE_LOCALE) return nome
    const nomes: Record<string, string> = locale === 'en' ? GENEROS_EN : {}
    return nomes[slug] ?? nome
}

/** Gêneros com o nome no idioma. */
export function generosNoIdioma(generos: WPTerm[], locale: Locale): WPTerm[] {
    if (locale === SOURCE_LOCALE) return generos
    return generos.map(g => ({ ...g, name: nomeDoGenero(g.slug, g.name, locale) }))
}
