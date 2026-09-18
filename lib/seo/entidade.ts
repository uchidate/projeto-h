/**
 * Sinais de identidade para o JSON-LD de perfis (Person, MusicGroup).
 *
 * Busca por nome de artista é a maior fonte de impressões do site, e para
 * esse tipo de busca o Google decide pelo Knowledge Graph: qual entidade é a
 * pessoa, e quais páginas falam dela. Até 2026-09-18 o `sameAs` dos perfis
 * listava só redes sociais — nenhum perfil apontava para a Wikipedia, que é a
 * referência que o Google mais usa para desambiguar a entidade.
 *
 * Só dado que a ficha já tem: título da Wikipedia resolvido pelos scripts de
 * popularidade (`wikipedia_title`), ou o link da fonte citada no próprio texto.
 * Nada é inferido — um `sameAs` errado liga o perfil à pessoa errada.
 */

const LINK_WIKIPEDIA = /https:\/\/(?:en|ko|pt)\.wikipedia\.org\/wiki\/[^"'\s<>#?]+/i

export function urlWikipedia(tituloIngles: string | null | undefined, conteudoHtml?: string): string | undefined {
    const titulo = tituloIngles?.trim()
    if (titulo) return `https://en.wikipedia.org/wiki/${encodeURIComponent(titulo.replace(/ /g, '_'))}`
    const achado = conteudoHtml?.match(LINK_WIKIPEDIA)?.[0]
    return achado || undefined
}

/** Valores de gênero do schema.org; `undefined` quando a ficha não registra. */
export function generoSchema(genero: string | null | undefined): string | undefined {
    if (genero === 'female') return 'https://schema.org/Female'
    if (genero === 'male') return 'https://schema.org/Male'
    return undefined
}

/** Altura em centímetros como QuantitativeValue (código UN/CEFACT "CMT"). */
export function alturaSchema(centimetros: number | string | null | undefined) {
    const valor = Number(centimetros)
    if (!Number.isFinite(valor) || valor < 100 || valor > 230) return undefined
    return { '@type': 'QuantitativeValue', value: valor, unitCode: 'CMT' }
}

/** Junta listas de URL sem repetir e sem vazio. */
export function juntarSameAs(...listas: Array<ReadonlyArray<string | undefined> | undefined>): string[] | undefined {
    const unicos = [...new Set(listas.flatMap(l => l ?? []).filter((u): u is string => !!u))]
    return unicos.length > 0 ? unicos : undefined
}
