import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { isActiveLocale } from '@/lib/i18n/config'
import { ArtistRoute, buildArtistMetadata } from '@/components/features/ArtistRoute'

export const revalidate = 600

type Params = Promise<{ locale: string; slug: string }>

// Sem pré-geração: só itens com tradução publicada terão página, e isso é
// decidido na Fase 3 (D5-b). Até lá, renderização sob demanda com ISR.
export function generateStaticParams() {
    return []
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!isActiveLocale(locale)) return {}
    return buildArtistMetadata(slug, locale)
}

export default async function IntlArtistPage({ params }: { params: Params }) {
    const { locale, slug } = await params
    if (!isActiveLocale(locale)) notFound()
    setPageLocale(locale)
    return <ArtistRoute slug={slug} locale={locale} />
}
