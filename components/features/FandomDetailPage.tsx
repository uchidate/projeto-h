import { SITE_NAME } from '@/lib/constants/site'
import type { Fandom } from '@/lib/wordpress/fandoms'
import { toMemberSummary } from '@/lib/artists/memberSummary'
import type { WPArtist } from '@/lib/wordpress/types'
import { stripHtml } from '@/lib/utils'
import { SITE_URL } from '@/lib/constants/site'
import { JsonLd } from '@/components/seo/JsonLd'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'
import { GroupMemberCard } from '@/components/groups/GroupMemberCard'
import { FandomGroupCard } from '@/components/fandoms/FandomGroupCard'
import { FandomSidebarFicha } from '@/components/fandoms/FandomSidebarFicha'
import { EntityFAQ, type EntityFAQItem } from '@/components/seo/EntityFAQ'

const SITE_ACCENT = '#e91e8c'

interface Props {
    fandom: Fandom
    artists: WPArtist[]
}

export function FandomDetailPage({ fandom, artists }: Props) {
    const { name, color, lightstick, groups } = fandom
    const accent = color ?? SITE_ACCENT
    const fandomUrl = `${SITE_URL}/fandoms/${fandom.slug}`

    const faqItems: EntityFAQItem[] = [
        {
            question: `Quem faz parte do fandom ${name}?`,
            answer: `${name} é o fandom de ${groups.map(g => stripHtml(g.title.rendered)).join(', ')} no ${SITE_NAME}.`,
        },
        lightstick
            ? {
                question: `Qual é o lightstick oficial do ${name}?`,
                answer: `O lightstick oficial ligado ao fandom ${name} é o ${lightstick}.`,
            }
            : null,
    ].filter(Boolean) as EntityFAQItem[]

    return (
        <>
            <h1 className="sr-only">{name}</h1>
            <JsonLd
                data={{
                    '@context': 'https://schema.org',
                    '@type': 'Organization',
                    name,
                    url: fandomUrl,
                }}
            />

            <div className="border-b border-border/40" style={{ borderTopColor: accent, borderTopWidth: 3 }}>
                <div className="page-wrap py-6 sm:py-10">
                    <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-1">Fandom</p>
                    <h2 className="text-[28px] sm:text-[40px] font-black tracking-[-0.03em] leading-tight" style={{ color: accent }}>
                        {name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-4 font-mono text-[11px] text-muted">
                        <span>{groups.length} grupo{groups.length !== 1 ? 's' : ''}</span>
                        {artists.length > 0 && (
                            <>
                                <span className="text-muted/30">·</span>
                                <span>{artists.length} artistas</span>
                            </>
                        )}
                        {lightstick && (
                            <>
                                <span className="text-muted/30">·</span>
                                <span>Lightstick: {lightstick}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="page-wrap py-8 lg:py-12">
                <div className="flex gap-10 items-start">
                    <div className="min-w-0 flex-1 space-y-12">
                        <section id="grupos">
                            <SectionTitleBar eyebrow="Fandom" title={`Grupos · ${groups.length}`} />
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {groups.map(group => <FandomGroupCard key={group.id} group={group} />)}
                            </div>
                        </section>

                        {ADSENSE.slots.inline && <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="fandom_profile_feed" />}

                        {artists.length > 0 && (
                            <section id="artistas">
                                <SectionTitleBar eyebrow="Fandom" title={`Artistas · ${artists.length}`} />
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                    {artists.map(artist => (
                                        <GroupMemberCard key={artist.id} member={toMemberSummary(artist)} accent={accent} />
                                    ))}
                                </div>
                            </section>
                        )}

                        <EntityFAQ items={faqItems} title={`Perguntas rápidas sobre ${name}`} />
                    </div>

                    <FandomSidebarFicha
                        color={color}
                        lightstick={lightstick}
                        groupCount={groups.length}
                        artistCount={artists.length}
                        accent={accent}
                    />
                </div>
            </div>
        </>
    )
}
