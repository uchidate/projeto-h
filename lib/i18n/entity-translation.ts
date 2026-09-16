import { ACTIVE_LOCALES, DEFAULT_LOCALE, isActiveLocale, type Locale } from './config'
import { TRANSLATABLE_ACF, pickTranslatable, type TranslatableType } from './translatable-fields'

/**
 * Tradução de fichas (artist, group, production) — D5-b em
 * docs/I18N-ARQUITETURA.md.
 *
 * O WordPress guarda um único post por ficha. A meta `_oc_i18n` tem, por
 * idioma, status, hash da fonte e os campos traduzidos; o REST expõe em
 * `translations` **apenas** os idiomas com status `published`, só os campos.
 *
 * Invariantes: tradução só substitui campos de ./translatable-fields.ts, e
 * dentro deles só strings — nunca números, booleanos, ids, URLs, datas, tipo
 * ou a forma de listas. Uma tradução malformada não quebra elenco, relações,
 * links ou imagens.
 */

type TranslatedValue = string | TranslatedValue[] | { [key: string]: TranslatedValue }

export interface EntityTranslation {
    title?: string
    content?: string
    excerpt?: string
    seo_title?: string
    seo_description?: string
    acf?: { [key: string]: TranslatedValue }
}

export interface TranslatableEntity {
    title: { rendered: string }
    content?: { rendered: string }
    excerpt?: { rendered: string }
    meta?: Record<string, unknown>
    acf?: Record<string, unknown> | null
    translations?: Partial<Record<string, EntityTranslation>> | null
}

/** Idiomas em que a ficha existe: português sempre, os demais se publicados e ativos. */
export function availableLocales(entity: Pick<TranslatableEntity, 'translations'>): Locale[] {
    const published = Object.keys(entity.translations ?? {}).filter(isActiveLocale)
    return ACTIVE_LOCALES.filter((locale) => locale === DEFAULT_LOCALE || published.includes(locale))
}

export function hasLocale(entity: Pick<TranslatableEntity, 'translations'>, locale: Locale): boolean {
    return availableLocales(entity).includes(locale)
}

/** Aplica só texto sobre `base`, preservando tipo e forma. */
export function mergeText(base: unknown, overlay: unknown): unknown {
    if (overlay === undefined || overlay === null) return base
    if (typeof base === 'string') return typeof overlay === 'string' && overlay.trim() ? overlay : base
    if (Array.isArray(base)) {
        if (!Array.isArray(overlay)) return base
        return base.map((item, index) => mergeText(item, overlay[index]))
    }
    if (base && typeof base === 'object') {
        if (typeof overlay !== 'object' || Array.isArray(overlay)) return base
        const source = overlay as Record<string, unknown>
        return Object.fromEntries(
            Object.entries(base).map(([key, value]) => [key, mergeText(value, source[key])]),
        )
    }
    return base
}

/** Devolve a ficha no idioma pedido. Em português, ou sem tradução, devolve a própria. */
export function localizeEntity<T extends TranslatableEntity>(entity: T, locale: Locale, type: TranslatableType): T {
    if (locale === DEFAULT_LOCALE) return entity
    const tr = entity.translations?.[locale]
    if (!tr) return entity

    const rendered = (field: { rendered: string } | undefined, value: string | undefined) =>
        field ? { ...field, rendered: mergeText(field.rendered, value) as string } : field

    return {
        ...entity,
        title: rendered(entity.title, tr.title)!,
        content: rendered(entity.content, tr.content),
        excerpt: rendered(entity.excerpt, tr.excerpt),
        meta: entity.meta && {
            ...entity.meta,
            // SEO manual do português não serve em outro idioma: sem tradução,
            // cai no título/descrição de fallback já no idioma da página.
            rank_math_title: tr.seo_title?.trim() || undefined,
            rank_math_description: tr.seo_description?.trim() || undefined,
        },
        acf: entity.acf ? (mergeText(entity.acf, pickTranslatable(tr.acf, TRANSLATABLE_ACF[type])) as T['acf']) : entity.acf,
        ...espelhosDeTopo(entity, tr, type),
    }
}

/**
 * Campos que o REST expoe tambem no nivel de cima da ficha, fora de `acf`.
 * A ficha de grupo le `group.editorial_analysis` (nao `acf.editorial_analysis`):
 * so traduzir o acf deixava a analise inteira em portugues na pagina em ingles.
 */
const ESPELHOS_DE_TOPO: Partial<Record<TranslatableType, readonly string[]>> = {
    group: ['editorial_analysis'],
}

function espelhosDeTopo(entity: TranslatableEntity, tr: EntityTranslation, type: TranslatableType): Record<string, unknown> {
    const campos = ESPELHOS_DE_TOPO[type] ?? []
    const base = entity as unknown as Record<string, unknown>
    const traduzidos = pickTranslatable(tr.acf, TRANSLATABLE_ACF[type]) as Record<string, unknown> | undefined
    return Object.fromEntries(
        campos
            .filter((campo) => typeof base[campo] === 'string')
            .map((campo) => [campo, mergeText(base[campo], traduzidos?.[campo])]),
    )
}
