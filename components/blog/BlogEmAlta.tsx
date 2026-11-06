import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import type { WPPost } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { tempoRelativoPt } from '@/lib/blog/tempoRelativo'
import { BlogAbas } from '@/components/blog/BlogAbas'

type Marcador = 'numero' | 'data'

function Lista({ posts, marcador }: { posts: WPPost[]; marcador: Marcador }) {
    return (
        <ol>
            {posts.slice(0, 4).map((p, i) => {
                const img = getWPImage(p._embedded, p.featured_image_url)
                const titulo = stripHtml(p.title.rendered)
                return (
                    <li key={p.id} className="border-b border-border/70">
                        <Link href={`/blog/${p.slug}`} data-posicao={i + 1} className="group flex items-center gap-3 py-3.5 lg:gap-4 lg:py-4">
                            {marcador === 'numero' && (
                                <span className="w-6 shrink-0 font-serif text-[24px] font-bold leading-none text-accent lg:w-7 lg:text-[30px]">{i + 1}</span>
                            )}
                            <span className="min-w-0 flex-1">
                                <span className="block text-[14px] font-bold leading-snug text-foreground transition-colors group-hover:text-accent lg:text-[17px]">{titulo}</span>
                                {marcador === 'data' && (
                                    <time dateTime={p.date} className="mt-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted">{tempoRelativoPt(p.date)}</time>
                                )}
                            </span>
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
    )
}

/**
 * Ao lado do destaque, em duas abas: "Últimas" (as mais novas, aberta por padrão, para a página
 * não abrir sem notícia quando o destaque é um guia antigo) e "Em alta" (próximos por leitura de
 * 90 dias, numerados). Sem as últimas, volta a ser só "Em alta".
 */
export function BlogEmAlta({ posts, ultimas = [] }: { posts: WPPost[]; ultimas?: WPPost[] }) {
    if (posts.length === 0 && ultimas.length === 0) return null
    const abas = [
        ...(ultimas.length > 0 ? [{ id: 'ultimas', rotulo: 'Últimas', node: <Lista posts={ultimas} marcador="data" /> }] : []),
        ...(posts.length > 0 ? [{ id: 'em-alta', rotulo: 'Em alta', node: <Lista posts={posts} marcador="numero" /> }] : []),
    ]
    return (
        <section data-bloco="blog-em-alta" aria-label="Últimas e em alta">
            <BlogAbas abas={abas} rotuloDoGrupo="Últimas e em alta" />
        </section>
    )
}
