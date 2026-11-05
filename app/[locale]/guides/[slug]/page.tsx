import type { Metadata } from 'next'
import { getAllHubs } from '@/lib/guias'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { GuiaPagina, buildGuiaMetadata } from '@/components/guias/GuiaPagina'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import { slugPtDoGuia } from '@/lib/guias/i18n'
import { LocalizedGuide, buildLocalizedGuideMetadata } from '@/components/guias/LocalizedGuide'

// Estática de propósito: ler `searchParams` aqui tornaria a rota dinâmica (`cache-control: no-store`,
// Cloudflare em BYPASS, toda visita renderiza na origem; medido em 2026-10-02). Filtros e paginação
// (?genre=, ?page=, …) são desviados para ./filtrado por um rewrite de lib/i18n/rotas-migradas.mjs.
export const revalidate = 3600

type Params = Promise<{ locale: string; slug: string }>

// Pré-geração só do português. O filho devolve SEMPRE `{ locale, ... }` completos: se devolvesse
// vazio para `en`, o Next repassaria `{ locale: 'en' }` sem o parâmetro e, por haver um conjunto
// incompleto, desistiria de pré-gerar TODOS os caminhos. Os outros idiomas renderizam sob demanda com ISR.
export async function generateStaticParams() {
    const hubs = await getAllHubs()
    return hubs.map(hub => ({ locale: DEFAULT_LOCALE, slug: hub.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    // Guia traduzido: metadata própria. Sem tradução, a página em português com o aviso, fora do índice.
    if (locale !== DEFAULT_LOCALE && slugPtDoGuia(slug, locale)) return buildLocalizedGuideMetadata(slug, locale)
    const metadata = await buildGuiaMetadata({ params: Promise.resolve({ slug }) })
    return locale === DEFAULT_LOCALE ? metadata : comoFallback(metadata)
}

export default async function Page({ params }: { params: Params }) {
    const { locale, slug } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale === DEFAULT_LOCALE) return <GuiaPagina slug={slug} sp={{}} />
    if (slugPtDoGuia(slug, locale)) return <LocalizedGuide slugPublico={slug} locale={locale} />
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('guide', { slug }, DEFAULT_LOCALE)} />
            <GuiaPagina slug={slug} sp={{}} />
        </>
    )
}
