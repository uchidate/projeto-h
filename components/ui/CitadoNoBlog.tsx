import Image from 'next/image'
import Link from 'next/link'
import type { WPPost } from '@/lib/wordpress/types'
import { stripHtml } from '@/lib/utils'

interface Props {
    posts: WPPost[]
    title?: string
}

/**
 * Antes era uma lista de texto simples ("No blog") perdida no rodapé da ficha.
 * Cartões com foto e resumo deixam o link pra matéria tão visível quanto a
 * vitrine de produtos ao lado — mais chance de o leitor seguir a cadeia
 * ficha → artigo → loja.
 */
export function CitadoNoBlog({ posts, title = 'Citado no blog' }: Props) {
    if (posts.length === 0) return null
    return (
        <div>
            <h2 className="mb-3 text-[18px] font-black tracking-tight">{title}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {posts.map(p => (
                    <Link key={p.id} href={`/blog/${p.slug}`}
                        className="group flex flex-col overflow-hidden rounded-xl border border-border hover:border-accent transition-colors">
                        {p.featured_image_url && (
                            <div className="relative aspect-video overflow-hidden bg-surface">
                                <Image src={p.featured_image_url} alt={stripHtml(p.title.rendered)} fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="(max-width: 640px) 100vw, 33vw" />
                            </div>
                        )}
                        <div className="p-3">
                            <p className="text-[14px] font-bold leading-snug group-hover:text-accent transition-colors line-clamp-2">
                                {stripHtml(p.title.rendered)}
                            </p>
                            {p.excerpt?.rendered && (
                                <p className="mt-1 text-[12px] text-muted leading-snug line-clamp-2">
                                    {stripHtml(p.excerpt.rendered)}
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
