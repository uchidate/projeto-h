import { SITE_NAME } from '@/lib/constants/site'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllFandoms, getFandomBySlug } from '@/lib/wordpress/fandoms'
import { stripHtml } from '@/lib/utils'
import { torcidasParecidas } from '@/lib/fandoms/afinidade'
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

    const grupos = fandom.groups.map(g => stripHtml(g.title.rendered))
    const listaGrupos = grupos.length > 2 ? `${grupos.slice(0, 2).join(', ')} e mais ${grupos.length - 2}` : grupos.join(' e ')
    const title = `${fandom.name}, a torcida do ${listaGrupos}: nome, cor e novidades`
    // A descrição só promete o que a página tem: o lightstick entra quando está cadastrado, as datas sempre que houver membros.
    const description = `Tudo sobre o fandom ${fandom.name}, a torcida ${grupos.length > 1 ? 'dos grupos' : 'do grupo'} ${listaGrupos}: de onde vem o nome, ${fandom.lightstick ? `lightstick (${fandom.lightstick}), ` : ''}próximas datas, novidades e torcidas parecidas.`
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

    // Torcidas parecidas (mesma agência, mesmo tipo de grupo, estreia próxima); a lista já está em cache.
    const todas = await getAllFandoms()
    const outras = torcidasParecidas(fandom, todas, 8).map(f => ({
        slug: f.slug, nome: f.name, cor: f.color ?? '#c39bff', grupo: stripHtml(f.groups[0]?.title.rendered ?? ''),
    }))

    const fandomUrl = `${SITE_URL}/fandoms/${slug}`
    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: `${SITE_NAME}`, url: SITE_URL },
        { name: 'Fandoms', url: `${SITE_URL}/fandoms` },
        { name: fandom.name, url: fandomUrl },
    ])

    return (
        <>
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', name: `${fandom.name}: torcida do ${fandom.groups.map(g => stripHtml(g.title.rendered)).join(', ')}`, url: fandomUrl, inLanguage: 'pt-BR', about: fandom.groups.map(g => ({ '@type': 'MusicGroup', name: stripHtml(g.title.rendered), url: `${SITE_URL}/groups/${g.slug}` })) }} />
            <FandomDetailPage fandom={fandom} artists={artists} outras={outras} />
        </>
    )
}
