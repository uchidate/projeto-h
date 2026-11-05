import type { RouteName } from './routes'
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
    artist: { shard: 'artists', listagem: 'artists', publico: true },
    group: { shard: 'groups', listagem: 'groups', publico: true },
    production: { shard: 'productions', listagem: 'productions', publico: true },
    agency: { shard: 'agencies', listagem: 'agencies', publico: false },
    company: { shard: 'companies', listagem: 'companies', publico: false },
    food: { shard: 'foods', listagem: 'foods', publico: false },
} as const satisfies Record<TranslatableType, { shard: string; listagem: RouteName; publico: boolean }>

export type TipoTraduzivel = keyof typeof ENTIDADES_TRADUZIVEIS

/** Tipos com tradução aceita no WordPress (inclui os que ainda não são públicos). */
export const TIPOS_TRADUZIVEIS = Object.keys(ENTIDADES_TRADUZIVEIS) as TipoTraduzivel[]

/** Tipos cuja versão traduzida já é pública: são os que o sitemap, o IndexNow e a borda enxergam. */
export const TIPOS_PUBLICOS = TIPOS_TRADUZIVEIS.filter((tipo) => ENTIDADES_TRADUZIVEIS[tipo].publico)

/** Nomes dos shards de sitemap que têm versão por idioma (`artists-en.xml`). */
export const SHARDS_TRADUZIVEIS = TIPOS_PUBLICOS.map((tipo) => ENTIDADES_TRADUZIVEIS[tipo].shard)
