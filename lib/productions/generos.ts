import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
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

/** Gêneros com o nome no idioma; sem tradução conhecida, mantém o nome do WordPress. */
export function generosNoIdioma(generos: WPTerm[], locale: Locale): WPTerm[] {
    if (locale === DEFAULT_LOCALE) return generos
    const nomes = locale === 'en' ? GENEROS_EN : {}
    return generos.map(g => (nomes[g.slug] ? { ...g, name: nomes[g.slug] } : g))
}
