import { SITE_NAME } from '@/lib/constants/site'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getGroupsByPosition } from '@/lib/wordpress/groups'
import { getArtistsByIds } from '@/lib/wordpress/artists'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { POSITION_LABELS, VALID_POSITIONS, isValidPosition } from '@/lib/constants/positions'
import { getWPImage, stripHtml } from '@/lib/utils'

export const revalidate = 1800

type Params = Promise<{ position: string }>

export async function generateStaticParams() {
    return VALID_POSITIONS.map(position => ({ position }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { position } = await params
    if (!isValidPosition(position)) return {}
    const label = POSITION_LABELS[position]
    const title = `Quem é ${label} em cada grupo de K-Pop`
    const description = `Veja todos os idols que ocupam a posição de ${label} nos grupos de k-pop cadastrados no ${SITE_NAME}.`
    const url = `${SITE_URL}/positions/${position}`
    return {
        title, description,
        alternates: { canonical: url },
        openGraph: baseOG(url),
        twitter: baseTwitter(),
    }
}

export default async function PositionDetailPage({ params }: { params: Params }) {
    const { position } = await params
    if (!isValidPosition(position)) notFound()

    const label = POSITION_LABELS[position]
    const groups = await getGroupsByPosition(position)

    const entries = await Promise.all(groups.map(async group => {
        const positionsMap = group.member_positions ?? {}
        const memberSlugs = Object.entries(positionsMap)
            .filter(([, positions]) => positions.includes(position))
            .map(([slug]) => slug)
        if (!memberSlugs.length) return null

        const memberIds = group.acf?.members ?? []
        const members = memberIds.length ? await getArtistsByIds(memberIds) : []
        const matched = members.filter(m => memberSlugs.includes(m.slug))
        if (!matched.length) return null

        return { group, members: matched }
    }))

    const rows = entries.filter((e): e is NonNullable<typeof e> => e !== null)

    return (
        <div className="mx-auto max-w-4xl px-4 py-10">
            <p className="text-xs font-mono uppercase tracking-wide text-muted">
                <Link href="/positions" className="hover:text-accent">Posições</Link> / {label}
            </p>
            <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">Quem é {label} em cada grupo</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
                {rows.length} grupo{rows.length === 1 ? '' : 's'} com {label.toLowerCase()} cadastrado.{' '}
                <Link href="/blog/posicoes-grupo-kpop-lider-vocal-visual-maknae-guia" className="underline decoration-dotted underline-offset-2 hover:text-accent">
                    Entenda o que essa posição significa
                </Link>.
            </p>

            <div className="mt-6 divide-y divide-border border-t border-border">
                {rows.map(({ group, members }) => {
                    const groupName = stripHtml(group.title.rendered)
                    return (
                        <div key={group.id} className="flex flex-wrap items-center gap-3 py-3">
                            <Link href={`/groups/${group.slug}`} className="min-w-28 shrink-0 font-bold text-foreground hover:text-accent">
                                {groupName}
                            </Link>
                            <div className="flex flex-wrap gap-2">
                                {members.map(member => {
                                    const name = stripHtml(member.title.rendered)
                                    const image = getWPImage(member._embedded, member.featured_image_url, name)
                                    return (
                                        <Link
                                            key={member.id}
                                            href={`/artists/${member.slug}`}
                                            className="flex items-center gap-2 border border-border bg-surface py-1 pl-1 pr-2 text-xs text-foreground transition-colors hover:border-accent"
                                        >
                                            {image ? (
                                                <Image src={image.src} alt={image.alt || name} width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
                                            ) : (
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-border text-[10px] font-bold">{name.charAt(0)}</span>
                                            )}
                                            {name}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {rows.length === 0 && (
                <p className="mt-6 text-sm text-muted">Nenhum grupo com essa posição cadastrada ainda.</p>
            )}
        </div>
    )
}
