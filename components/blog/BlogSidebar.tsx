import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import type { WPPost, WPTerm } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { catStyle, postReadingTime } from '@/lib/blog/catStyle'

function RecentPost({ post, index }: { post: WPPost; index: number }) {
    const image = getWPImage(post._embedded, post.featured_image_url)
    const title = stripHtml(post.title.rendered)
    const cats: WPTerm[] = (post._embedded?.['wp:term']?.[0] ?? []) as WPTerm[]
    const cat = cats[0]
    const cs = catStyle(cat?.slug)
    const mins = postReadingTime(post)

    return (
        <Link href={`/blog/${post.slug}`}
            className="group flex items-start gap-3 p-3 border-y border-border bg-background transition-colors hover:border-accent/40 hover:bg-surface/55">
            <span className="text-[17px] font-black leading-none w-5 shrink-0 mt-0.5 tabular-nums"
                style={{ color: `hsl(330 80% ${Math.max(35, 65 - index * 8)}%)` }}>
                {index + 1}
            </span>
            <div className="flex-1 min-w-0">
                <p className="font-serif text-[13px] font-medium leading-[1.1] text-foreground line-clamp-2 group-hover:text-accent transition-colors mb-1.5">
                    {title}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {cat && (
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold"
                            style={{ color: cs.color, backgroundColor: cs.bg }}>
                            {cat.name}
                        </span>
                    )}
                    {mins !== null && (
                        <span className="text-[10px] text-muted flex items-center gap-0.5">
                            <Clock size={9} /> {mins} min
                        </span>
                    )}
                </div>
            </div>
            {image && (
                <div className="relative w-11 h-11 overflow-hidden shrink-0 bg-surface">
                    <Image src={image.src} alt={title} fill sizes="44px" className="object-cover" />
                </div>
            )}
        </Link>
    )
}

interface BlogSidebarProps {
    recentPosts: WPPost[]
    categories: WPTerm[]
    currentCategory?: string
}

export function BlogSidebar({ recentPosts, categories, currentCategory }: BlogSidebarProps) {
    /* O rótulo vale em qualquer página porque a fonte passou a ser ancorada no
       offset: `getSidebarPosts` busca o que vem DEPOIS da página atual, então o
       bloco sempre aponta adiante. Enquanto ele trazia os mais recentes, na
       página 2 listava os primeiros cards da página 1 — o leitor já tinha
       passado por eles, e "continue" apontava para trás. */
    return (
        /* Fixa na rolagem: a coluna tem ~500px de conteúdo ao lado de uma grade
           de ~2.000px, então ela terminava no primeiro terço e deixava o resto
           da largura vazio pelo resto da página. */
        <aside className="space-y-7 lg:sticky lg:top-[calc(var(--site-header-h,52px)+var(--reading-bar-h,42px)+16px)]">
            {recentPosts.length > 0 && (
                <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-4 flex items-center gap-1.5">
                        <Clock size={11} className="text-accent" /> Continue no arquivo
                    </p>
                    <div className="space-y-2">
                        {recentPosts.map((p, i) => <RecentPost key={p.id} post={p} index={i} />)}
                    </div>
                </div>
            )}

            {categories.length > 0 && (
                <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-3">Categorias</p>
                    <div className="flex flex-wrap gap-1.5">
                        {categories.map(cat => {
                            const cs = catStyle(cat.slug)
                            return (
                                <Link key={cat.id} href={`/blog?category=${cat.slug}`}
                                    className="px-2.5 py-1 text-[11px] font-semibold border border-border hover:border-accent/50 transition-colors"
                                    style={currentCategory === cat.slug ? { borderColor: cs.color, color: cs.color } : {}}>
                                    {cat.name}
                                    {cat.count != null && cat.count > 0 && (
                                        <span className="ml-1 opacity-40">{cat.count}</span>
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}
        </aside>
    )
}
