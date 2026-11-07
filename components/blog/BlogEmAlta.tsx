import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import type { WPPost } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { tempoRelativo, type TextosTempo } from '@/lib/blog/tempoRelativo'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { slugPublicoDoPost } from '@/lib/blog/translations'
import { BlogAbas } from '@/components/blog/BlogAbas'

type Marcador = 'numero' | 'data'

function Lista({ posts, marcador, locale, tempo }: { posts: WPPost[]; marcador: Marcador; locale: Locale; tempo?: TextosTempo }) {
    return (
        <ol>
            {posts.slice(0, 4).map((p, i) => {
                const img = getWPImage(p._embedded, p.featured_image_url)
                const titulo = stripHtml(p.title.rendered)
                return (
                    <li key={p.id} className="border-b border-border/70">
                        <Link href={`/blog/${slugPublicoDoPost(p.translations, p.slug)}`} data-posicao={i + 1} className="group flex items-center gap-3 py-3.5 lg:gap-4 lg:py-4">
                            {marcador === 'numero' && (
                                <span className="w-6 shrink-0 font-serif text-[24px] font-bold leading-none text-accent lg:w-7 lg:text-[30px]">{i + 1}</span>
                            )}
                            <span className="min-w-0 flex-1">
                                <span className="block text-[14px] font-bold leading-snug text-foreground transition-colors group-hover:text-accent lg:text-[17px]">{titulo}</span>
                                {marcador === 'data' && (
                                    <time dateTime={p.date} className="mt-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted">{tempoRelativo(p.date, locale, tempo)}</time>
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
export type TextosEmAlta = { latest: string; trending: string; both: string; tempo?: TextosTempo }

export function BlogEmAlta({ posts, ultimas = [], locale = DEFAULT_LOCALE, textos = { latest: 'Últimas', trending: 'Em alta', both: 'Últimas e em alta' } }: { posts: WPPost[]; ultimas?: WPPost[]; locale?: Locale; textos?: TextosEmAlta }) {
    if (posts.length === 0 && ultimas.length === 0) return null
    const abas = [
        ...(ultimas.length > 0 ? [{ id: 'ultimas', rotulo: textos.latest, node: <Lista posts={ultimas} marcador="data" locale={locale} tempo={textos.tempo} /> }] : []),
        ...(posts.length > 0 ? [{ id: 'em-alta', rotulo: textos.trending, node: <Lista posts={posts} marcador="numero" locale={locale} /> }] : []),
    ]
    return (
        <section data-bloco="blog-em-alta" aria-label={textos.both}>
            <BlogAbas abas={abas} rotuloDoGrupo={textos.both} />
        </section>
    )
}
