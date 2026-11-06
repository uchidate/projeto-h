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
 * `routes.ts`), com rótulo traduzido. Cultura 101 e fandoms entram mesmo mostrando o texto em
 * português com o aviso de falta de tradução: esconder o link deixava o menu
 * em inglês menor que o do português.
 *
 * Fonte única: `NAV_ITEMS` define os itens uma vez; menu e rodapé derivam dela.
 */
export type NavLabels = { home: string; productions: string; artists: string; groups: string; blog: string; guides: string; foods: string; quiz: string; calendar: string; culture: string; fandoms: string }

type NavItem = { route: 'home' | 'productions' | 'artists' | 'groups' | 'blog' | 'guides' | 'foods' | 'quiz' | 'calendar' | 'cultura101' | 'fandoms'; label: keyof NavLabels }

/** Itens do menu fora do português, na ordem do menu em português. */
export const NAV_ITEMS: readonly NavItem[] = [
    { route: 'home', label: 'home' },
    { route: 'productions', label: 'productions' },
    { route: 'artists', label: 'artists' },
    { route: 'groups', label: 'groups' },
    { route: 'blog', label: 'blog' },
    { route: 'guides', label: 'guides' },
    { route: 'cultura101', label: 'culture' },
    { route: 'foods', label: 'foods' },
    { route: 'fandoms', label: 'fandoms' },
    { route: 'calendar', label: 'calendar' },
    { route: 'quiz', label: 'quiz' },
]

function navLink(item: NavItem, locale: Locale, labels: NavLabels): SiteLink {
    return { label: labels[item.label], href: href(item.route, undefined, locale) }
}

export function localizedNavigation(locale: Locale, labels: NavLabels): SiteLink[] {
    if (locale === DEFAULT_LOCALE) return []
    return NAV_ITEMS.map(item => navLink(item, locale, labels))
}

export type FooterLabelsI18n = { catalog: string; explore: string; about: string; agencies: string; aboutUs: string; contact: string }

/** Rodapé fora do português: as mesmas famílias de links do rodapé em PT (catálogo, explorar, sobre), só com rotas que existem no idioma. */
export function localizedFooterColumns(locale: Locale, footer: FooterLabelsI18n, labels: NavLabels): FooterColumn[] {
    if (locale === DEFAULT_LOCALE) return []
    return [
        { heading: footer.catalog, links: [
            ...(['productions', 'artists', 'groups'] as const).map(route => navLink(NAV_ITEMS.find(i => i.route === route)!, locale, labels)),
            { label: footer.agencies, href: href('agencies', undefined, locale) },
        ] },
        { heading: footer.explore, links: [
            ...(['blog', 'guides', 'cultura101', 'foods', 'fandoms', 'calendar', 'quiz'] as const)
                .map(route => navLink(NAV_ITEMS.find(i => i.route === route)!, locale, labels)),
        ] },
        { heading: footer.about, links: [
            { label: footer.aboutUs, href: href('about', undefined, locale) },
            { label: footer.contact, href: href('contact', undefined, locale) },
        ] },
    ]
}
