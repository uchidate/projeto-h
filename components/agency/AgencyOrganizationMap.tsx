import { useTranslations } from 'next-intl'
import { href } from '@/lib/i18n/routes'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import { Network } from 'lucide-react'
import { BlockHeader } from '@/components/blocks/BlockHeader'
import type { AgencyNetwork } from '@/lib/agencies/network'
import type { WPAgency, WPArtist, WPGroup } from '@/lib/wordpress/types'
import { agencyMark } from '@/lib/agencies/presentation'
import { entityBelongsToOrganizations } from '@/lib/agencies/network'
import { getWPImage, stripHtml } from '@/lib/utils'

function belongsTo(entity: WPArtist | WPGroup, organizationId: number) {
    return entityBelongsToOrganizations(entity, [organizationId])
}

type Props = {
    agency: WPAgency
    network: AgencyNetwork
    groups: WPGroup[]
    artists: WPArtist[]
    locale?: Locale
}

export function AgencyOrganizationMap({ agency, network, groups, artists, locale = DEFAULT_LOCALE }: Props) {
    const t = useTranslations('entity.agency.ui')
    const kindLabel = (kind: string | undefined, fallback: string) =>
        kind && ['conglomerate', 'label', 'agency', 'joint_venture', 'division'].includes(kind) ? t(`kinds.${kind as 'label'}`) : fallback
    const name = stripHtml(agency.title.rendered)
    const related = network.organizations.filter(item => item.id !== agency.id)
    if (related.length === 0 && network.ancestors.length === 0) return null

    return (
        <section id="ecossistema" className="scroll-mt-(--scroll-anchor-offset,106px)">
            <BlockHeader
                eyebrow={t('map.eyebrow')}
                title={t('map.title', { name })}
                icon={<Network className="h-4 w-4 text-(--ac)" />}
                meta={<span className="font-mono text-[10px] text-muted">{t('map.relations', { count: related.length })}</span>}
            />
            <p className="profile-content-measure -mt-2 mb-6 text-[14px] leading-6 text-muted">
                {network.ancestors.length > 0
                    ? t('map.parentLinked')
                    : t('map.mainLevel')}
            </p>

            {network.ancestors.length > 0 && (
                <div className="mb-8 border-l-2 border-(--ac) bg-surface p-5 sm:p-6">
                    <p className="profile-kicker text-(--ac)">{t('map.parentKicker')}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                        {network.ancestors.map(parent => {
                            const parentName = stripHtml(parent.title.rendered)
                            return (
                                <Link key={parent.id} href={href('agency', { slug: parent.slug }, locale)} className="group inline-flex min-w-48 items-center justify-between gap-5 border border-border bg-background px-4 py-3 transition-colors hover:border-(--ac)">
                                    <span>
                                        <span className="block font-mono text-[10px] font-black uppercase tracking-[0.12em] text-muted">{kindLabel(parent.acf?.organization_kind, t('map.parentFallback'))}</span>
                                        <strong className="mt-1 block text-[15px] group-hover:text-accent">{parentName}</strong>
                                    </span>
                                    <span aria-hidden="true" className="text-lg text-(--ac)">→</span>
                                </Link>
                            )
                        })}
                    </div>
                    <p className="mt-3 text-[11px] leading-5 text-muted">{t('map.parentNote')}</p>
                </div>
            )}

            <div className="relative mx-auto mb-8 max-w-xl border border-(--ac) bg-(--ac-08) p-6 text-center">
                <p className="profile-kicker text-(--ac)">{network.ancestors.length > 0 ? t('map.focus') : t('map.level1')} · {kindLabel(agency.acf?.organization_kind, t('map.mainFallback'))}</p>
                <h3 className="mt-2 text-2xl font-black">{name}</h3>
                <p className="mt-2 text-[12px] leading-5 text-muted">
                    {network.ancestors.length > 0
                        ? t('map.focusWithParent')
                        : t('map.focusMain')}
                </p>
                {related.length > 0 && <div aria-hidden="true" className="absolute left-1/2 top-full h-8 w-px -translate-x-1/2 [background:var(--ac)]" />}
            </div>

            {related.length > 0 && (
                <>
                    <div className="mb-4 flex items-center gap-3">
                        <span className="profile-kicker text-(--ac)">{t('map.level2')}</span>
                        <span aria-hidden="true" className="h-px flex-1 bg-border" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {related.map(item => {
                    const itemName = stripHtml(item.title.rendered)
                    const image = getWPImage(item._embedded, item.featured_image_url)
                    const groupCount = groups.filter(group => belongsTo(group, item.id)).length
                    const artistCount = artists.filter(artist => belongsTo(artist, item.id)).length
                    return (
                        <Link key={item.id} href={href('agency', { slug: item.slug }, locale)} className="profile-panel group flex min-h-32 items-start gap-4 p-5 transition-colors hover:border-(--ac)">
                            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-border bg-background">
                                {image ? <Image src={image.src} alt={t('map.logoAlt', { name: itemName })} fill className="object-contain p-2" sizes="56px" /> : <span className="font-black text-muted">{agencyMark(itemName)}</span>}
                            </div>
                            <div className="min-w-0">
                                <p className="profile-kicker text-(--ac)">{kindLabel(item.acf?.organization_kind, t('map.relatedFallback'))}</p>
                                <h3 className="mt-1 text-[17px] font-black leading-tight group-hover:text-accent">{itemName}</h3>
                                {item.acf?.region && <p className="mt-1 text-[11px] text-muted">{item.acf.region}</p>}
                                {(groupCount > 0 || artistCount > 0) && <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted">{t('map.counts', { groups: groupCount, artists: artistCount })}</p>}
                            </div>
                        </Link>
                    )
                        })}
                    </div>
                </>
            )}

            <div className="mt-6 border-l-2 border-(--ac) bg-surface px-5 py-4">
                <p className="profile-kicker text-(--ac)">{related.length > 0 ? t('map.level3') : t('map.direct')}</p>
                <p className="mt-2 text-[13px] leading-6 text-foreground/70">
                    {related.length > 0
                        ? t('map.level3Body')
                        : t('map.directBody')}
                </p>
            </div>
        </section>
    )
}
