import { useTranslations } from 'next-intl'
import type { WPPost } from '@/lib/wordpress/types'
import { BlogPostCard } from '@/components/blog/BlogPostCard'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

interface Props {
    posts: WPPost[]
    label: string
    artistName: string
    categoryMap?: Record<number, { name: string; slug: string }>
}

export function ArtistPosts({ posts, label, artistName, categoryMap }: Props) {
    const t = useTranslations('profile.ui')
    if (!posts.length) return null
    return (
        <div className="bg-surface/70">
            <div className="py-10 sm:py-14">
                <SectionTitleBar
                    eyebrow={label}
                    title={t('readingsAbout', { name: artistName })}
                    href={`/blog?search=${encodeURIComponent(artistName)}`}
                    linkText={t('moreReadings')}
                    className="mb-6 profile-measure"
                />
                <div className="grid gap-4 sm:grid-cols-2 profile-measure lg:grid-cols-4">
                    {posts.map(post => <BlogPostCard key={post.id} post={post} categoryMap={categoryMap} />)}
                </div>
            </div>
        </div>
    )
}
