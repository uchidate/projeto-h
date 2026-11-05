import { href, type RouteName } from './routes'
import { DEFAULT_LOCALE, type Locale } from './config'
import type { TranslatableType } from './translatable-fields'

/**
 * Fichas que podem ter tradução publicada — a lista única de tipos traduzíveis do lado do site.
 *
 * Cada tipo de `TRANSLATABLE_ACF` (campos que uma tradução substitui) precisa de uma entrada aqui
 * (`satisfies Record<TranslatableType, …>`): é o que liga o tipo ao sitemap por idioma, ao IndexNow e à
 * listagem purgada na borda. Acrescentar um tipo = uma entrada em `TRANSLATABLE_ACF` + uma aqui + o
 * espelho no PHP (`oc_i18n_translatable_fields` e `oc_i18n_post_types`, ver `translatable-fields.test.ts`).
 *
 * `publico`: a página do tipo já lê a tradução, tem canonical/hreflang próprios e o sitemap por idioma sabe
 * montar as URLs dela. Enquanto for `false` o tipo existe no WordPress (dá para traduzir e revisar), mas não
 * entra no sitemap, no IndexNow nem no hreflang. Virar `true` é o último passo de cada tipo.
 *
 * A ORDEM importa: o primeiro tipo carrega a home do idioma no sitemap (`dynamicSitemap.ts`).
 */
export const ENTIDADES_TRADUZIVEIS = {
    artist: { shard: 'artists', ficha: 'artist', listagem: 'artists', publico: true },
    group: { shard: 'groups', ficha: 'group', listagem: 'groups', publico: true },
    production: { shard: 'productions', ficha: 'production', listagem: 'productions', publico: true },
    agency: { shard: 'agencies', ficha: 'agency', listagem: 'agencies', publico: true },
    company: { shard: 'companies', ficha: 'company', listagem: 'companies', publico: true },
    food: { shard: 'foods', ficha: 'food', listagem: 'foods', publico: true },
} as const satisfies Record<TranslatableType, { shard: string; ficha: RouteName; listagem: RouteName; publico: boolean }>

export type TipoTraduzivel = keyof typeof ENTIDADES_TRADUZIVEIS

/** Tipos com tradução aceita no WordPress (inclui os que ainda não são públicos). */
export const TIPOS_TRADUZIVEIS = Object.keys(ENTIDADES_TRADUZIVEIS) as TipoTraduzivel[]

/** Tipos cuja versão traduzida já é pública: são os que o sitemap, o IndexNow e a borda enxergam. */
export const TIPOS_PUBLICOS = TIPOS_TRADUZIVEIS.filter((tipo) => ENTIDADES_TRADUZIVEIS[tipo].publico)

/** Nomes dos shards de sitemap que têm versão por idioma (`artists-en.xml`). */
export const SHARDS_TRADUZIVEIS = TIPOS_PUBLICOS.map((tipo) => ENTIDADES_TRADUZIVEIS[tipo].shard)

/** Caminho público da ficha no idioma (`/en/foods/gochujang`), pelo registro de rotas — o caminho em inglês não é o do português com prefixo. */
export function caminhoDaFicha(tipo: TipoTraduzivel, slug: string, locale: Locale = DEFAULT_LOCALE): string {
    return (href as unknown as (rota: RouteName, params: { slug: string }, locale: Locale) => string)(ENTIDADES_TRADUZIVEIS[tipo].ficha, { slug }, locale)
}

/** Caminho público da listagem do tipo no idioma. */
export function caminhoDaListagem(tipo: TipoTraduzivel, locale: Locale = DEFAULT_LOCALE): string {
    return href(ENTIDADES_TRADUZIVEIS[tipo].listagem as 'artists', undefined, locale)
}

export function tipoDoShard(shard: string): TipoTraduzivel | undefined {
    return TIPOS_TRADUZIVEIS.find((tipo) => ENTIDADES_TRADUZIVEIS[tipo].shard === shard)
}
