import type { RouteName } from './routes'
import type { TranslatableType } from './translatable-fields'

/**
 * Fichas que podem ter tradução publicada — a lista única de tipos traduzíveis do lado do site.
 *
 * Cada tipo de `TRANSLATABLE_ACF` (campos que uma tradução substitui) precisa de uma entrada aqui
 * (`satisfies Record<TranslatableType, …>`): é o que liga o tipo ao sitemap por idioma, ao IndexNow e à
 * listagem purgada na borda. Acrescentar um tipo = uma entrada em `TRANSLATABLE_ACF` + uma aqui + o
 * espelho no PHP (`oc_i18n_translatable_fields`, ver `translatable-fields.test.ts`).
 *
 * A ORDEM importa: o primeiro tipo carrega a home do idioma no sitemap (`dynamicSitemap.ts`).
 */
export const ENTIDADES_TRADUZIVEIS = {
    artist: { shard: 'artists', listagem: 'artists' },
    group: { shard: 'groups', listagem: 'groups' },
    production: { shard: 'productions', listagem: 'productions' },
} as const satisfies Record<TranslatableType, { shard: string; listagem: RouteName }>

export type TipoTraduzivel = keyof typeof ENTIDADES_TRADUZIVEIS

export const TIPOS_TRADUZIVEIS = Object.keys(ENTIDADES_TRADUZIVEIS) as TipoTraduzivel[]

/** Nomes dos shards de sitemap que têm versão por idioma (`artists-en.xml`). */
export const SHARDS_TRADUZIVEIS = TIPOS_TRADUZIVEIS.map((tipo) => ENTIDADES_TRADUZIVEIS[tipo].shard)
