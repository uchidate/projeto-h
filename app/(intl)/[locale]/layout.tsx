import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { SITE_URL, SITE_NAME } from '@/lib/constants/site'
import { SiteShell } from '@/components/layout/SiteShell'
import { ACTIVE_LOCALES, DEFAULT_LOCALE, LOCALE_META, isActiveLocale } from '@/lib/i18n/config'

/**
 * Root layout dos idiomas além do português — ver D2 em docs/I18N-ARQUITETURA.md.
 *
 * O português não passa por aqui: vive em `app/(site)` sem prefixo. Por isso
 * `/pt/...` e idiomas desligados em `ACTIVE_LOCALES` respondem 404.
 */
// Sem `dynamicParams = false` aqui: a config é herdada pelas rotas filhas e,
// como nenhuma ficha é pré-gerada, toda ficha em outro idioma dava 404
// (NoFallbackError), inclusive as com tradução publicada — e a rota filha não
// consegue sobrescrever. Idioma desligado continua 404 pelo `notFound()` abaixo.

export function generateStaticParams() {
    return ACTIVE_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({ locale }))
}

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!isActiveLocale(locale)) return {}
    return {
        metadataBase: new URL(SITE_URL),
        title: { template: `%s | ${SITE_NAME}`, default: SITE_NAME },
        manifest: '/manifest.json',
        openGraph: { siteName: SITE_NAME, locale: LOCALE_META[locale].ogLocale, type: 'website' },
    }
}

export default async function IntlLayout({ children, params }: { children: React.ReactNode; params: Params }) {
    const { locale } = await params
    if (locale === DEFAULT_LOCALE || !isActiveLocale(locale)) notFound()
    setPageLocale(locale)
    return <SiteShell locale={locale}>{children}</SiteShell>
}
