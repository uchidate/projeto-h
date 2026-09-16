import type { Metadata } from 'next'
import { getProductions } from '@/lib/wordpress/productions'

import { ProductionRoute, buildProductionMetadata } from '@/components/features/ProductionRoute'
export const revalidate = 600

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
    if (process.env.SKIP_BUILD_STATIC_GENERATION) return []
    try {
        const { items } = await getProductions({ perPage: 100 })
        return items.map(p => ({ slug: p.slug }))
    } catch {
        return []
    }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params
    return buildProductionMetadata(slug, 'pt')
}

export default async function ProductionPage({ params }: { params: Params }) {
    const { slug } = await params
    return <ProductionRoute slug={slug} locale="pt" />
}
