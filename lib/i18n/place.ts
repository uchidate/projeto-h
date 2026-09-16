import { DEFAULT_LOCALE, type Locale } from './config'

/**
 * Nomes de lugar vindos do TMDB chegam em inglês ("Seoul, South Korea" em ~1.000
 * fichas de artista). A página em português exibia "Origem: Philippines".
 *
 * Tradução só de EXIBIÇÃO: o valor no WordPress e o `birthPlace` do JSON-LD
 * continuam como vieram. Cobre os países e cidades que concentram os dados;
 * o que não está na tabela passa intacto — melhor inglês do que tradução errada.
 */
const PT: Record<string, string> = {
    'South Korea': 'Coreia do Sul',
    'Republic of Korea': 'Coreia do Sul',
    'Korea': 'Coreia do Sul',
    'South Korean': 'Coreia do Sul',
    'North Korea': 'Coreia do Norte',
    'Seoul': 'Seul',
    'New York': 'Nova York',
    'Philippines': 'Filipinas',
    'Japan': 'Japão',
    'China': 'China',
    'Taiwan': 'Taiwan',
    'Hong Kong': 'Hong Kong',
    'Thailand': 'Tailândia',
    'Indonesia': 'Indonésia',
    'Vietnam': 'Vietnã',
    'Singapore': 'Singapura',
    'Malaysia': 'Malásia',
    'United States': 'Estados Unidos',
    'United States of America': 'Estados Unidos',
    'USA': 'Estados Unidos',
    'Canada': 'Canadá',
    'Australia': 'Austrália',
    'New Zealand': 'Nova Zelândia',
    'United Kingdom': 'Reino Unido',
    'Germany': 'Alemanha',
    'France': 'França',
    'Brazil': 'Brasil',
    'North Gyeongsang': 'Gyeongsang do Norte',
    'South Gyeongsang': 'Gyeongsang do Sul',
    'North Jeolla': 'Jeolla do Norte',
    'South Jeolla': 'Jeolla do Sul',
    'North Chungcheong': 'Chungcheong do Norte',
    'South Chungcheong': 'Chungcheong do Sul',
}

export function localizePlace(value: string | null | undefined, locale: Locale = DEFAULT_LOCALE): string | null {
    const trimmed = value?.trim()
    if (!trimmed) return null
    if (locale !== 'pt') return trimmed
    return trimmed
        .split(',')
        .map(part => {
            const token = part.trim()
            return PT[token] ?? token
        })
        .join(', ')
}

/** Contração de "em" + artigo para país sozinho: "nas Filipinas", "no Japão". */
const PREPOSICAO_PT: Record<string, string> = {
    'Coreia do Sul': 'na', 'Coreia do Norte': 'na', 'China': 'na', 'Tailândia': 'na', 'Indonésia': 'na',
    'Malásia': 'na', 'Austrália': 'na', 'Nova Zelândia': 'na', 'Alemanha': 'na', 'França': 'na',
    'Filipinas': 'nas',
    'Japão': 'no', 'Vietnã': 'no', 'Canadá': 'no', 'Reino Unido': 'no', 'Brasil': 'no',
    'Estados Unidos': 'nos',
}

/**
 * Lugar pronto para "nasceu ___". Com cidade na frente ("Seul, Coreia do Sul")
 * vai "em"; país sozinho pede o artigo ("na Coreia do Sul", não "em Coreia do Sul").
 */
export function placeWithPreposition(place: string, locale: Locale = DEFAULT_LOCALE): string {
    if (locale !== 'pt') return `in ${place}`
    if (place.includes(',')) return `em ${place}`
    return `${PREPOSICAO_PT[place] ?? 'em'} ${place}`
}
