import type { Metadata } from 'next'
import { getArtists } from '@/lib/wordpress/artists'
import { ArtistRoute, buildArtistMetadata } from '@/components/features/ArtistRoute'

// 6h (era 600s). O `s-maxage` da borda vem daqui, e com 600s a cauda longa quase nunca
// acertava o cache (3 de 40 páginas, 2026-09-24; miss custa 0,8 a 2,2s contra 0,2s).
// Seguro porque `/api/revalidate` expurga a cópia da borda deste item (lib/cloudflare-purge.ts).
// Mudança feita por script SEM passar por essa rota só aparece na borda em até 6h:
// use o skill revalidar-cache depois de alteração programática.
export const revalidate = 21600

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
