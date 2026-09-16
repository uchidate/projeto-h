import { DEFAULT_LOCALE, type Locale } from './config'
import { href } from './routes'
import type { FooterColumn, SiteLink } from '@/lib/wordpress/site-settings'

/**
 * Menu e rodapé fora do português.
 *
 * A navegação vem do WordPress só em português e aponta para rotas sem versão
 * traduzida (`/calendario`, `/blog`, `/guias/...`). No piloto EN isso deixava a
 * ficha em inglês cercada de links em português — conferido em produção em
 * 2026-09-16. Aqui o menu lista apenas o que EXISTE no idioma (registro em
 * `routes.ts`), com rótulo traduzido.
 */
export type NavLabels = { productions: string; artists: string; groups: string }

export function localizedNavigation(locale: Locale, labels: NavLabels): SiteLink[] {
    if (locale === DEFAULT_LOCALE) return []
    return [
        { label: labels.productions, href: href('productions', undefined, locale) },
        { label: labels.artists, href: href('artists', undefined, locale) },
        { label: labels.groups, href: href('groups', undefined, locale) },
    ]
}

export function localizedFooterColumns(locale: Locale, heading: string, labels: NavLabels): FooterColumn[] {
    if (locale === DEFAULT_LOCALE) return []
    return [{ heading, links: localizedNavigation(locale, labels) }]
}
