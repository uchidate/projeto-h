import type { Locale } from './config'

/**
 * Recursos que só existem em português por decisão de produto (manifesto de rotas):
 * dependem de preço em reais, afiliado e frete nacional, de perguntas escritas só em
 * português ou de catálogo de streaming do Brasil. Uma única lista, em vez de
 * `locale === DEFAULT_LOCALE` espalhado pelos componentes.
 */
export type Recurso = 'loja' | 'quiz' | 'streamingBrasil'

const IDIOMAS_COM_RECURSO: Record<Recurso, readonly Locale[]> = {
    loja: ['pt'],
    quiz: ['pt'],
    streamingBrasil: ['pt'],
}

/** O recurso é oferecido neste idioma? */
export function temRecurso(recurso: Recurso, locale: Locale): boolean {
    return IDIOMAS_COM_RECURSO[recurso].includes(locale)
}
