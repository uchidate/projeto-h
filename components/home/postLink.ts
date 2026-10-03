import { DEFAULT_LOCALE, LOCALE_META, type Locale } from '@/lib/i18n/config'

/**
 * Artigos só existem em português: em outro idioma o link vai direto ao original
 * (`/blog/<slug>`), com `hrefLang` avisando — e `HomePtBadge` marca o item.
 */
export function postLink(slug: string, locale: Locale) {
    return {
        href: `/blog/${slug}`,
        ...(locale !== DEFAULT_LOCALE && { hrefLang: LOCALE_META[DEFAULT_LOCALE].htmlLang }),
    }
}
