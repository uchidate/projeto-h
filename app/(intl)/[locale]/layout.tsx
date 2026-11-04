import type { Metadata } from 'next'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import { metadataDoLayout } from '@/lib/i18n/metadata-layout'
import { SiteShell } from '@/components/layout/SiteShell'
import { ACTIVE_LOCALES } from '@/lib/i18n/config'

/**
 * Layout de todos os idiomas — ver D2 em docs/I18N-ARQUITETURA.md.
 *
 * Em migração: as rotas já movidas para cá servem o português SEM prefixo por um rewrite em
 * `next.config.mjs` (`/about` -> `/pt/about`); o `/pt/...` digitado direto responde 404 no `proxy.ts`.
 * Idiomas desligados em `ACTIVE_LOCALES` respondem 404. As rotas ainda não movidas continuam em
 * `app/(site)` e recusam `pt` por conta própria.
 */
// Sem `dynamicParams = false` aqui: a config é herdada pelas rotas filhas e,
// como nenhuma ficha é pré-gerada, toda ficha em outro idioma dava 404
// (NoFallbackError), inclusive as com tradução publicada — e a rota filha não
// consegue sobrescrever. Idioma desligado continua 404 pelo `notFound()` abaixo.

export function generateStaticParams() {
    return ACTIVE_LOCALES.map((locale) => ({ locale }))
}

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return metadataDoLayout(locale)
}

export default async function IntlLayout({ children, params }: { children: React.ReactNode; params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return <SiteShell locale={locale}>{children}</SiteShell>
}
