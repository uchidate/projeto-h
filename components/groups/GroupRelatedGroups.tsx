import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import type { WPGroup } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { GroupSectionHeading } from '@/components/groups/GroupSectionHeading'

interface Props {
    groups: WPGroup[]
    accent: string
    agencyName: string | null
}

export function GroupRelatedGroups({ groups, accent, agencyName }: Props) {
    const t = useTranslations('profile.ui')
    if (groups.length === 0) return null

    const visible = groups.slice(0, 6)
    const hasMore = groups.length > 6
    const title = agencyName ? t('sameAgency', { agency: agencyName }) : t('keepExploring')

    return (
        <div className="space-y-4">
            <GroupSectionHeading id="relacionados-titulo" eyebrow={t('discover')} title={title} accent={accent} />

            {/* Mobile: scroll horizontal; desktop: grid — mesma linguagem de capa quadrada da era rail */}
            <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
                {visible.map(rg => {
                    const rgImg = getWPImage(rg._embedded, rg.featured_image_url)
                    const rgName = stripHtml(rg.title.rendered)
                    const rgColor = rg.acf?.color ?? accent

                    return (
                        <Link key={rg.id} href={`/groups/${rg.slug}`}
                            className="group/rg relative w-[148px] shrink-0 snap-start overflow-hidden border border-border bg-surface transition-colors hover:border-foreground/30 sm:w-auto">
                            <figure className="relative aspect-square overflow-hidden bg-black">
                                {rgImg ? (
                                    <Image src={rgImg.src} alt={rgName} fill sizes="(max-width: 640px) 148px, 33vw"
                                        className="object-cover object-top grayscale transition-all duration-500 group-hover/rg:scale-105 group-hover/rg:grayscale-0" />
                                ) : (
                                    <div className="flex h-full items-center justify-center" style={{ background: `${rgColor}22` }}>
                                        <span className="text-3xl font-black text-muted">{rgName[0]}</span>
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-3 backdrop-blur-xs">
                                    <p className="line-clamp-2 text-[13px] font-black leading-snug text-white">{rgName}</p>
                                    {rg.acf?.fandom_name && (
                                        <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.08em]" style={{ color: rgColor }}>
                                            {rg.acf.fandom_name}
                                        </p>
                                    )}
                                </div>
                                <span aria-hidden="true" className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full opacity-0 transition-opacity group-hover/rg:opacity-100" style={{ background: rgColor }} />
                            </figure>
                        </Link>
                    )
                })}
            </div>

            {hasMore && (
                <Link href="/groups" className="inline-block font-mono text-[11px] font-semibold text-muted transition-colors hover:text-foreground">
                    {t('moreGroups')}
                </Link>
            )}
        </div>
    )
}
