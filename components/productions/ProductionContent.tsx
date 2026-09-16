import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { WPPost } from '@/lib/wordpress/types'
import { extractYoutubeId } from '@/lib/utils'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { BlogCompactCard } from '@/components/blog/BlogCompactCard'
import { GroupMVPlayer } from '@/components/groups/GroupMVPlayer'
import { BlockHeader } from '@/components/blocks/BlockHeader'

interface Props {
    title: string
    contentBefore: string
    contentAfter: string
    acf: Record<string, unknown>
    relatedPosts: WPPost[]
    hasTrailerInline?: boolean
    categoryMap?: Record<number, { name: string; slug: string }>
}

export function ProductionContent({ title, contentBefore, contentAfter, acf, relatedPosts, hasTrailerInline, categoryMap }: Props) {
    const t = useTranslations('profile.ui')
    return (
        <>
            <BlockHeader title={t('synopsis')} eyebrow={t('dossier')} tone="muted" size="lg" />
            <div className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-black prose-a:text-accent prose-a:no-underline prose-a:hover:underline"
                dangerouslySetInnerHTML={{ __html: contentBefore }} />

            {ADSENSE.slots.inline && <AdSlotInline slot={ADSENSE.slots.inline} layout="content" analyticsPlacement="production_content" />}

            {contentAfter && (
                <div className="prose prose-lg dark:prose-invert max-w-none
                    prose-headings:font-black prose-a:text-accent prose-a:no-underline prose-a:hover:underline"
                    dangerouslySetInnerHTML={{ __html: contentAfter }} />
            )}

            {(acf.director || acf.writer || acf.main_cast) && (
                <div className="mt-10 border border-border bg-surface p-6">
                    <h2 className="text-[16px] font-black mb-4">{t('technicalSheet')}</h2>
                    <dl className="grid sm:grid-cols-2 gap-3 text-[14px]">
                        {!!acf.director && (
                            <div>
                                <dt className="text-[11px] font-black uppercase tracking-wider text-muted mb-0.5">{t('sidebar.director')}</dt>
                                <dd className="text-foreground font-semibold">{String(acf.director)}</dd>
                            </div>
                        )}
                        {!!acf.writer && (
                            <div>
                                <dt className="text-[11px] font-black uppercase tracking-wider text-muted mb-0.5">{t('sidebar.writer')}</dt>
                                <dd className="text-foreground font-semibold">{String(acf.writer)}</dd>
                            </div>
                        )}
                        {!!acf.main_cast && (
                            <div className="sm:col-span-2">
                                <dt className="text-[11px] font-black uppercase tracking-wider text-muted mb-0.5">{t('sidebar.mainCast')}</dt>
                                <dd className="text-foreground">{String(acf.main_cast)}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            )}

            {hasTrailerInline && acf.trailer_url && extractYoutubeId(acf.trailer_url as string) && (
                <div id="trailer" className="mt-10 scroll-mt-(--scroll-anchor-offset,134px)">
                    <BlockHeader title={t('officialTrailer')} eyebrow={t('video')} tone="muted" />
                    <GroupMVPlayer
                        videos={[{ title: t('trailerOf', { title }), url: acf.trailer_url as string }]}
                        accent="#e91e8c"
                    />
                </div>
            )}

            {relatedPosts.length > 0 && (
                <div id="artigos" className="mt-10 scroll-mt-(--scroll-anchor-offset,134px)">
                    <div className="flex items-baseline justify-between mb-5">
                        <h2 className="text-[18px] font-black">{t('articles')}</h2>
                        <Link href={`/blog?search=${encodeURIComponent(title)}`}
                            className="font-mono text-[11px] text-accent hover:underline uppercase tracking-[0.06em]">{t('seeMore')}</Link>
                    </div>
                    <div className="flex flex-col gap-2">
                        {relatedPosts.map(post => <BlogCompactCard key={post.id} post={post} categoryMap={categoryMap} />)}
                    </div>
                </div>
            )}
        </>
    )
}
