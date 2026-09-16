import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { WPPost, WPTerm } from '@/lib/wordpress/types'
import { stripHtml, formatDatePt } from '@/lib/utils'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

const CAT_COLORS: Record<string, { light: string; dark: string }> = {
    'k-drama': { light: '#be185d', dark: '#f472b6' },
    'k-pop': { light: '#6d28d9', dark: '#a78bfa' },
    'k-film': { light: '#0369a1', dark: '#38bdf8' },
    'cultura': { light: '#15803d', dark: '#4ade80' },
    'grupos': { light: '#a16207', dark: '#fbbf24' },
    'k-beauty': { light: '#be185d', dark: '#f472b6' },
}

export function HomeLatestPosts({ posts, categoryMap }: { posts: WPPost[]; categoryMap?: Record<number, { name: string; slug: string }> }) {
    if (!posts.length) return null
    return (
        <div className="border-t border-border px-4 py-8 sm:px-6 lg:px-10">
            <SectionTitleBar title="Últimas publicações" href="/blog" linkText="ver feed →" />
            <div>
                {posts.map((post, i) => {
                    const cat = post.categories?.[0] && categoryMap
                        ? categoryMap[post.categories[0]]
                        : ((post._embedded?.['wp:term']?.[0] ?? []) as WPTerm[])[0]
                    const color = CAT_COLORS[cat?.slug ?? ''] ?? CAT_COLORS['k-drama']
                    return (
                        <Link key={post.id} href={`/blog/${post.slug}`}
                            className={`group grid-cols-[96px_minmax(0,1fr)] items-center gap-3 border-b border-border py-4 transition-colors hover:bg-surface/60 sm:grid-cols-[96px_minmax(0,1fr)_112px] sm:gap-5 ${i >= 4 ? 'hidden lg:grid' : 'grid'}`}>
                            <span
                                className="inline-block truncate text-[9px] font-black uppercase tracking-[0.12em] text-(--category-light) dark:text-(--category-dark)"
                                style={{ '--category-light': color.light, '--category-dark': color.dark } as CSSProperties}
                            >
                                {cat?.name ?? 'Artigo'}
                            </span>
                            <span className="line-clamp-2 text-[13px] font-medium leading-[1.3] text-foreground transition-colors group-hover:text-accent sm:text-[15px]">
                                {stripHtml(post.title.rendered)}
                            </span>
                            <span className="hidden sm:block text-right font-mono text-[10px] text-muted">
                                {formatDatePt(post.date)}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
