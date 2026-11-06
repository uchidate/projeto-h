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

export type FooterLabelsI18n = { catalog: string; explore: string; guides: string; about: string; agencies: string; aboutUs: string; contact: string }

/** Rodapé fora do português: as mesmas famílias de links do rodapé em PT (catálogo, explorar, sobre), só com rotas que existem no idioma. */
export function localizedFooterColumns(locale: Locale, footer: FooterLabelsI18n, labels: NavLabels, guides: SiteLink[] = []): FooterColumn[] {
    if (locale === DEFAULT_LOCALE) return []
    return [
        { heading: footer.catalog, links: [
            { label: labels.productions, href: href('productions', undefined, locale) },
            { label: labels.artists, href: href('artists', undefined, locale) },
            { label: labels.groups, href: href('groups', undefined, locale) },
            { label: footer.agencies, href: href('agencies', undefined, locale) },
        ] },
        ...(guides.length > 0 ? [{ heading: footer.guides, links: guides }] : []),
        { heading: footer.explore, links: [
            { label: labels.blog, href: href('blog', undefined, locale) },
            { label: labels.guides, href: href('guides', undefined, locale) },
            { label: labels.foods, href: href('foods', undefined, locale) },
            { label: labels.quiz, href: href('quiz', undefined, locale) },
        ] },
        { heading: footer.about, links: [
            { label: footer.aboutUs, href: href('about', undefined, locale) },
            { label: footer.contact, href: href('contact', undefined, locale) },
        ] },
    ]
}
