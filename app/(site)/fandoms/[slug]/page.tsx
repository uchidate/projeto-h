import { SITE_NAME } from '@/lib/constants/site'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllFandoms, getFandomBySlug } from '@/lib/wordpress/fandoms'
import { getArtistsByIds } from '@/lib/wordpress/artists'
import { SITE_URL, buildOgImageUrl } from '@/lib/constants/site'
import { buildWordPressMetadata } from '@/lib/seo/wordpress'
import { buildBreadcrumbSchema } from '@/lib/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLd'
import { FandomDetailPage } from '@/components/features/FandomDetailPage'

export const revalidate = 600

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
    const fandoms = await getAllFandoms()
    return fandoms.map(f => ({ slug: f.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params
    const fandom = await getFandomBySlug(slug)
    if (!fandom) return {}

    const title = `Fandom ${fandom.name} — grupos e curiosidades`
    const description = `Conheça o fandom ${fandom.name}: cor oficial, lightstick e todos os grupos K-Pop ligados a essa torcida.`
    const url = `${SITE_URL}/fandoms/${slug}`

    return buildWordPressMetadata({
        title,
        description,
        url,
        ogImageOverride: buildOgImageUrl({ title, subtitle: description, type: 'group' }),
    })
}

export default async function FandomPage({ params }: { params: Params }) {
    const { slug } = await params
    const fandom = await getFandomBySlug(slug)
    if (!fandom) notFound()

    const memberIds = Array.from(new Set(fandom.groups.flatMap(g => g.acf?.members ?? [])))
    const artists = await getArtistsByIds(memberIds)

    const fandomUrl = `${SITE_URL}/fandoms/${slug}`
    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: `${SITE_NAME}`, url: SITE_URL },
        { name: 'Fandoms', url: `${SITE_URL}/fandoms` },
        { name: fandom.name, url: fandomUrl },
    ])

    return (
        <>
            <JsonLd data={breadcrumbSchema} />
            <FandomDetailPage fandom={fandom} artists={artists} />
        </>
    )
}
