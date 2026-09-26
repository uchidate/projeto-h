import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { WPPost } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'

interface Props {
    title: string
    posts: WPPost[]
    categoryMap?: Record<number, { name: string; slug: string }>
}

/**
 * Matérias sobre a produção, como cartões com imagem (grade no desktop, linhas com
 * miniatura no celular). A lista compacta anterior, só texto, tinha o mesmo destino
 * mas nenhuma razão visual para o clique: em 30 dias o "Leia também" dos artigos
 * teve 12 cliques em ~2,3 mil leituras.
 */
export function ProductionBlogGrid({ title, posts, categoryMap }: Props) {
    const t = useTranslations('profile.ui')
    if (!posts.length) return null
    const cartoes = posts.slice(0, 3)

    return (
        <section id="artigos" data-bloco="ficha-producao-blog" aria-labelledby="h-artigos" className="scroll-mt-(--scroll-anchor-offset,134px)">
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-border pb-3.5">
                <h2 id="h-artigos" className="font-serif text-[26px] font-semibold tracking-tight text-foreground lg:text-[34px]">{t('articles')}</h2>
                <Link href={`/blog?search=${encodeURIComponent(title)}`} className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-accent hover:text-accent-strong lg:text-[11px]">
                    {t('seeMore')}
                </Link>
            </div>
            <div className="grid gap-x-7 gap-y-1 lg:grid-cols-3 lg:gap-y-7">
                {cartoes.map(post => {
                    const imagem = getWPImage(post._embedded, post.featured_image_url)
                    const titulo = stripHtml(post.title.rendered)
                    const categoria = post.categories?.map(id => categoryMap?.[id]?.name).find(Boolean)
                    return (
                        <Link key={post.id} href={`/blog/${post.slug}`}
                            className="group grid grid-cols-[104px_minmax(0,1fr)] items-center gap-3.5 border-b border-border/60 py-3.5 lg:block lg:border-0 lg:py-0">
                            <span className="relative block aspect-4/3 overflow-hidden border border-border bg-surface lg:aspect-video">
                                {imagem && <Image src={imagem.src} alt="" fill sizes="(min-width: 1024px) 33vw, 104px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
                            </span>
                            <span className="block lg:mt-3.5">
                                {categoria && <span className="block font-mono text-[9px] font-black uppercase tracking-[0.14em] text-accent lg:text-[10px]">{categoria}</span>}
                                <span className="mt-1 block text-[15px] font-bold leading-snug text-foreground transition-colors group-hover:text-accent lg:mt-2 lg:font-serif lg:text-[22px] lg:font-semibold lg:leading-tight">{titulo}</span>
                            </span>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}
