import Image from 'next/image'
import Link from 'next/link'
import type { WPPost } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'

/** Ao lado do destaque: os próximos artigos por interesse (leitura de 90 dias), numerados. */
export function BlogEmAlta({ posts }: { posts: WPPost[] }) {
    if (posts.length === 0) return null
    return (
        <section data-bloco="blog-em-alta" aria-labelledby="em-alta-titulo">
            <h2 id="em-alta-titulo" className="border-b border-border pb-2.5 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-accent">Em alta</h2>
            <ol>
                {posts.slice(0, 4).map((p, i) => {
                    const img = getWPImage(p._embedded, p.featured_image_url)
                    const titulo = stripHtml(p.title.rendered)
                    return (
                        <li key={p.id} className="border-b border-border/70">
                            <Link href={`/blog/${p.slug}`} data-posicao={i + 1} className="group flex items-center gap-3 py-3.5 lg:gap-4 lg:py-4">
                                <span className="w-6 shrink-0 font-serif text-[24px] font-bold leading-none text-accent lg:w-7 lg:text-[30px]">{i + 1}</span>
                                <span className="min-w-0 flex-1 text-[14px] font-bold leading-snug text-foreground transition-colors group-hover:text-accent lg:text-[17px]">{titulo}</span>
                                {/* Guia sem imagem destacada: só o texto, sem quadrado vazio. */}
                                {img && (
                                    <span className="relative h-14 w-20 shrink-0 overflow-hidden bg-surface lg:h-20 lg:w-[120px]">
                                        <Image src={img.src} alt="" fill sizes="120px" className="object-cover" />
                                    </span>
                                )}
                            </Link>
                        </li>
                    )
                })}
            </ol>
        </section>
    )
}
