/**
 * Alias de ordenação por relevância na REST do WordPress (oc_orderby).
 * O inglês tem nota própria (relevance_score_en: o que as páginas /en recebem de acesso, com o geral
 * como apoio). Espanhol e japonês ainda têm sessões de menos para um ranking próprio e usam o geral.
 */
export function aliasDeRelevancia(locale?: string): 'relevance' | 'relevance_en' {
    return locale === 'en' ? 'relevance_en' : 'relevance'
}
