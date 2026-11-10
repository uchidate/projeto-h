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

const GENEROS_ES: Record<string, string> = {
    acao: 'Acción',
    animacao: 'Animación',
    comedia: 'Comedia',
    crime: 'Crimen',
    documentario: 'Documental',
    drama: 'Drama',
    fantasia: 'Fantasía',
    ficcao: 'Ciencia ficción',
    historico: 'Histórico',
    misterio: 'Misterio',
    musical: 'Musical',
    romance: 'Romance',
    terror: 'Terror',
    thriller: 'Thriller',
    variedades: 'Variedades',
}

const GENEROS_JA: Record<string, string> = {
    acao: 'アクション',
    animacao: 'アニメーション',
    comedia: 'コメディ',
    crime: 'クライム',
    documentario: 'ドキュメンタリー',
    drama: 'ドラマ',
    fantasia: 'ファンタジー',
    ficcao: 'SF',
    historico: '時代劇',
    misterio: 'ミステリー',
    musical: 'ミュージカル',
    romance: 'ロマンス',
    terror: 'ホラー',
    thriller: 'スリラー',
    variedades: 'バラエティ',
}

const NOMES_POR_IDIOMA: Partial<Record<Locale, Record<string, string>>> = { en: GENEROS_EN, es: GENEROS_ES, ja: GENEROS_JA }

/** Nome de um gênero no idioma; sem tradução conhecida, mantém o nome do WordPress. */
export function nomeDoGenero(slug: string, nome: string, locale: Locale): string {
    if (locale === SOURCE_LOCALE) return nome
    return NOMES_POR_IDIOMA[locale]?.[slug] ?? nome
}

/** Nome em português (o do WordPress) -> slug, para traduzir o campo de texto livre `acf.genre` ("Crime · Drama · Mistério"). */
const SLUG_POR_NOME_PT: Record<string, string> = {
    'ação': 'acao', 'animação': 'animacao', 'comédia': 'comedia', crime: 'crime', 'documentário': 'documentario', drama: 'drama',
    fantasia: 'fantasia', 'ficção científica': 'ficcao', 'histórico': 'historico', 'mistério': 'misterio', musical: 'musical',
    romance: 'romance', terror: 'terror', thriller: 'thriller', variedades: 'variedades',
}

/** Traduz o texto livre de gêneros (separado por "·", "," ou "/"); nome desconhecido fica como veio. */
export function generosEmTexto(texto: string | undefined, locale: Locale): string | undefined {
    if (!texto || locale === SOURCE_LOCALE) return texto
    return texto.replace(/[^·,/]+/g, parte => {
        const nome = parte.trim()
        const slug = SLUG_POR_NOME_PT[nome.toLowerCase()]
        const traduzido = slug ? nomeDoGenero(slug, nome, locale) : nome
        return parte.replace(nome, traduzido)
    })
}

/** Gêneros com o nome no idioma. */
export function generosNoIdioma(generos: WPTerm[], locale: Locale): WPTerm[] {
    if (locale === SOURCE_LOCALE) return generos
    return generos.map(g => ({ ...g, name: nomeDoGenero(g.slug, g.name, locale) }))
}
