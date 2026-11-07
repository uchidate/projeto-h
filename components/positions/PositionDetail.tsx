import { Fragment } from 'react'
import { SITE_NAME } from '@/lib/constants/site'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { metadataDaRota } from '@/lib/i18n/metadata-pagina'
import Link from '@/components/i18n/LocalizedLink'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getGroupsByPosition } from '@/lib/wordpress/groups'
import { getArtistsByIds } from '@/lib/wordpress/artists'
import { isValidPosition } from '@/lib/constants/positions'
import { rotuloDaPosicao } from '@/lib/constants/rotulo-posicao'
import { getWPImage, stripHtml } from '@/lib/utils'


type Params = Promise<{ position: string }>

export async function metadataDaPagina({ params, locale = DEFAULT_LOCALE }: { params: Params; locale?: Locale }): Promise<Metadata> {
    const { position } = await params
    if (!isValidPosition(position)) return {}
    const t = await getTranslations({ locale, namespace: 'client.positionsPage' })
    const label = rotuloDaPosicao(t, position)
    return metadataDaRota({ locale, rota: 'position', params: { position }, titulo: t('detailTitle', { label }), descricao: t('detailDescription', { label, site: SITE_NAME }) })
}

export default async function PositionDetailPage({ params, locale = DEFAULT_LOCALE }: { params: Params; locale?: Locale }) {
    const { position } = await params
    if (!isValidPosition(position)) notFound()

    const t = await getTranslations({ locale, namespace: 'client.positionsPage' })
    const label = rotuloDaPosicao(t, position)
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
                <Link href="/positions" className="hover:text-accent">{t('crumb')}</Link> / {label}
            </p>
            <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">{t('detailTitleH1', { label })}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
                {t('detailCount', { count: rows.length, label: locale === DEFAULT_LOCALE ? label.toLowerCase() : label })}{' '}
                <Link href="/blog/posicoes-grupo-kpop-lider-vocal-visual-maknae-guia" className="underline decoration-dotted underline-offset-2 hover:text-accent">
                    {t('detailGuide')}
                </Link>.
            </p>

            <div className="mt-6 divide-y divide-border border-t border-border">
                {rows.map(({ group, members }, indice) => {
                    const groupName = stripHtml(group.title.rendered)
                    return (
                        <Fragment key={group.id}>
                        {/* A cada 20 grupos, no máximo 3. A primeira versão (a cada 8) deu
                            10 anúncios em 7,9 telas — as linhas desta lista são curtas, e
                            contar itens não mede rolagem. Medido em 2026-09-18. */}
                        {indice > 0 && indice % 20 === 0 && indice <= 60 && ADSENSE.slots.inline && (
                            <div className="py-6">
                                <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="posicao_lista" />
                            </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3 py-3">
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
                        </Fragment>
                    )
                })}
            </div>

            {rows.length === 0 && (
                <p className="mt-6 text-sm text-muted">{t('empty')}</p>
            )}
        </div>
    )
}
