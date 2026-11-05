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
 * `routes.ts`), com rótulo traduzido. Rota que em outro idioma só mostra o texto em português
 * (calendário, cultura 101, fandoms) fica de fora até ter tradução.
 */
export type NavLabels = { home: string; productions: string; artists: string; groups: string; blog: string; guides: string; foods: string; quiz: string }

export function localizedNavigation(locale: Locale, labels: NavLabels): SiteLink[] {
    if (locale === DEFAULT_LOCALE) return []
    return [
        { label: labels.home, href: href('home', undefined, locale) },
        { label: labels.productions, href: href('productions', undefined, locale) },
        { label: labels.artists, href: href('artists', undefined, locale) },
        { label: labels.groups, href: href('groups', undefined, locale) },
        { label: labels.blog, href: href('blog', undefined, locale) },
        { label: labels.guides, href: href('guides', undefined, locale) },
        { label: labels.foods, href: href('foods', undefined, locale) },
        { label: labels.quiz, href: href('quiz', undefined, locale) },
    ]
}

export function localizedFooterColumns(locale: Locale, heading: string, labels: NavLabels): FooterColumn[] {
    if (locale === DEFAULT_LOCALE) return []
    return [{ heading, links: localizedNavigation(locale, labels) }]
}
