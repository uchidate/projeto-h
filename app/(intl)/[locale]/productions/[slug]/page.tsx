import type { Metadata } from 'next'
import { getProductions } from '@/lib/wordpress/productions'
import { ProductionRoute, buildProductionMetadata } from '@/components/productions/ProductionRoute'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

// 6h (era 600s). O `s-maxage` da borda vem daqui, e com 600s a cauda longa quase nunca
// acertava o cache (3 de 40 páginas, 2026-09-24; miss custa 0,8 a 2,2s contra 0,2s).
// Seguro porque `/api/revalidate` expurga a cópia da borda deste item (lib/cloudflare-purge.ts).
// Mudança feita por script SEM passar por essa rota só aparece na borda em até 6h:
// use o skill revalidar-cache depois de alteração programática.
export const revalidate = 21600

type Params = Promise<{ locale: string; slug: string }>

// Só o português é pré-gerado. Em outros idiomas só itens com tradução publicada têm página
// (decidido na Fase 3, D5-b): renderização sob demanda com ISR.
export async function generateStaticParams({ params }: { params: { locale: string } }) {
    if (params.locale !== DEFAULT_LOCALE) return []
    if (process.env.SKIP_BUILD_STATIC_GENERATION) return []
    try {
        const { items } = await getProductions({ perPage: 100 })
        return items.map(item => ({ slug: item.slug }))
    } catch {
        return []
    }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return buildProductionMetadata(slug, locale)
}

export default async function Page({ params }: { params: Params }) {
    const { locale, slug } = await params
    entrarNaPagina(locale, { servePt: true })
    return <ProductionRoute slug={slug} locale={locale} />
}
