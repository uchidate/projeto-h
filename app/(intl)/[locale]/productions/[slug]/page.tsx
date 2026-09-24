import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { isActiveLocale } from '@/lib/i18n/config'
import { ProductionRoute, buildProductionMetadata } from '@/components/features/ProductionRoute'

// 6h (era 600s). O `s-maxage` da borda vem daqui, e com 600s a cauda longa quase nunca
// acertava o cache (3 de 40 páginas, 2026-09-24; miss custa 0,8 a 2,2s contra 0,2s).
// Seguro porque `/api/revalidate` expurga a cópia da borda deste item (lib/cloudflare-purge.ts).
// Mudança feita por script SEM passar por essa rota só aparece na borda em até 6h:
// use o skill revalidar-cache depois de alteração programática.
export const revalidate = 21600

type Params = Promise<{ locale: string; slug: string }>

// Sem pré-geração: só itens com tradução publicada terão página, e isso é
// decidido na Fase 3 (D5-b). Até lá, renderização sob demanda com ISR.
export function generateStaticParams() {
    return []
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!isActiveLocale(locale)) return {}
    return buildProductionMetadata(slug, locale)
}

export default async function IntlProductionPage({ params }: { params: Params }) {
    const { locale, slug } = await params
    if (!isActiveLocale(locale)) notFound()
    setPageLocale(locale)
    return <ProductionRoute slug={slug} locale={locale} />
}
