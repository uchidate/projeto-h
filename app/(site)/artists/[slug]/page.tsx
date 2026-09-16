import type { Metadata } from 'next'
import { getArtists } from '@/lib/wordpress/artists'
import { ArtistRoute, buildArtistMetadata } from '@/components/features/ArtistRoute'

export const revalidate = 600

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
    try {
        const { items } = await getArtists({ perPage: 100 })
        return items.map(a => ({ slug: a.slug }))
    } catch {
        return []
    }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params
    return buildArtistMetadata(slug, 'pt')
}

export default async function ArtistPage({ params }: { params: Params }) {
    const { slug } = await params
    return <ArtistRoute slug={slug} locale="pt" />
}
