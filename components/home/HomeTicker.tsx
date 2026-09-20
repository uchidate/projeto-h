import Link from 'next/link'
import { removeTags } from '@/lib/utils'
import { getPosts } from '@/lib/wordpress/posts'

export async function HomeTicker() {
    const { items: posts } = await getPosts({ perPage: 10, orderby: 'date', order: 'desc' })
    if (!posts.length) return null

    // duplicar para loop contínuo
    const items = [...posts, ...posts]

    return (
        <div className="w-full h-[30px] flex items-center overflow-hidden border-b border-border bg-background">
            {/* Label acento */}
            <div className="flex h-full shrink-0 items-center bg-accent px-3.5">
                <span className="text-white text-[8.5px] font-black uppercase tracking-[0.18em] whitespace-nowrap">
                    Novidades
                </span>
            </div>

            {/* Faixa rolando */}
            <div className="overflow-hidden flex-1">
                <div className="flex items-center animate-home-ticker whitespace-nowrap" style={{ width: 'max-content' }}>
                    {items.map((post, idx) => {
                        const title = removeTags(post.title.rendered)
                        return (
                            <Link
                                key={`${post.slug}-${idx}`}
                                href={`/blog/${post.slug}`}
                                className="inline-flex items-center gap-2 px-5 h-[30px] text-[11px] text-foreground/75 hover:text-accent transition-colors whitespace-nowrap shrink-0"
                            >
                                <span className="w-1 h-1 bg-accent/50 shrink-0" aria-hidden />
                                {title}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
