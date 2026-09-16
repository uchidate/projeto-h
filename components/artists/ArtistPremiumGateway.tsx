import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { WPGroup, WPPost, WPProduction } from '@/lib/wordpress/types'
import type { ArtistProfileModel } from '@/lib/profiles/artistProfile'
import type { DiscographyAlbum } from '@/components/groups/GroupDiscography'
import { stripHtml } from '@/lib/utils'
import { GroupSectionHeading } from '@/components/groups/GroupSectionHeading'

interface Props {
    name: string
    essencia: ArtistProfileModel['essencia']
    groups: WPGroup[]
    productions: WPProduction[]
    discography: DiscographyAlbum[]
    relatedPosts: WPPost[]
    accent: string
}

function firstProduction(productions: WPProduction[]) {
    return productions.find(production => production.slug)
}

export function ArtistPremiumGateway({ name, essencia, groups, productions, discography, relatedPosts, accent }: Props) {
    const t = useTranslations('profile.ui')
    const group = groups[0]
    const production = firstProduction(productions)
    const album = discography[0]
    const post = relatedPosts[0]

    const entries = [
        essencia.portaEntrada && {
            label: t('gateway.startLabel'),
            title: essencia.portaEntrada,
            text: t('gateway.startText'),
            href: album?.spotifyUrl,
            external: !!album?.spotifyUrl,
        },
        group && {
            label: t('gateway.groupLabel'),
            title: stripHtml(group.title.rendered),
            text: t('gateway.groupText', { name }),
            href: `/groups/${group.slug}`,
        },
        production && {
            label: t('gateway.actingLabel'),
            title: stripHtml(production.title.rendered),
            text: t('gateway.actingText'),
            href: `/productions/${production.slug}`,
        },
        post && {
            label: t('gateway.readingLabel'),
            title: stripHtml(post.title.rendered),
            text: t('gateway.readingText'),
            href: `/blog/${post.slug}`,
        },
    ].filter(Boolean).slice(0, 4) as Array<{ label: string; title: string; text: string; href?: string; external?: boolean }>

    if (!entries.length) return null

    return (
        <section id="guia" className="scroll-mt-(--scroll-anchor-offset,106px)">
            <div className="mb-6"><GroupSectionHeading id="guia-titulo" eyebrow={t('gateway.eyebrow')} title={t('gateway.title', { name })} accent={accent} /></div>

            <div className="profile-panel grid divide-y divide-border/70 profile-measure lg:grid-cols-4 lg:divide-x lg:divide-y-0">
                {entries.map((entry, index) => {
                    const content = (
                        <div className="flex h-full gap-4 p-4 sm:p-5">
                            <span className="mt-0.5 font-mono text-[10px] font-black text-muted">{String(index + 1).padStart(2, '0')}</span>
                            <div className="min-w-0">
                                <p className="profile-kicker">{entry.label}</p>
                                <h3 className="mt-1.5 text-[1rem] font-black leading-snug tracking-[-0.02em] text-foreground">{entry.title}</h3>
                                <p className="mt-2 text-[13px] leading-5 text-muted">{entry.text}</p>
                            </div>
                        </div>
                    )

                    if (!entry.href) {
                        return <article key={`${entry.label}-${entry.title}`}>{content}</article>
                    }

                    if (entry.external) {
                        return (
                            <a key={`${entry.label}-${entry.title}`} href={entry.href} target="_blank" rel="noopener noreferrer"
                                className="touch-target block transition-colors hover:bg-white dark:hover:bg-surface">
                                {content}
                            </a>
                        )
                    }

                    return (
                        <Link key={`${entry.label}-${entry.title}`} href={entry.href}
                            className="touch-target block transition-colors hover:bg-white dark:hover:bg-surface">
                            {content}
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}
