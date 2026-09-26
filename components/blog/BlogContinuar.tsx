import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import type { WPPost } from '@/lib/wordpress/types'
import { getWPImage, readingTime, stripHtml } from '@/lib/utils'
import { motivoDaSugestao } from '@/lib/blog/motivoSugestao'

interface Props {
    /** Artigo que o leitor acabou de ler: a referência do "porque". */
    atual: WPPost
    /** Em ordem de relevância. O primeiro vira o destaque. */
    candidatos: WPPost[]
    verMaisHref: string
}

function Motivo({ atual, candidato, categoria }: { atual: WPPost; candidato: WPPost; categoria: boolean }) {
    const motivo = motivoDaSugestao(atual, candidato, { categoria })
    if (!motivo) return null
    return (
        <span className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-accent">
            {motivo.imagem && (
                <span className="relative block h-5 w-5 shrink-0 overflow-hidden rounded-full bg-surface">
                    <Image src={motivo.imagem} alt="" fill sizes="20px" className="object-cover object-top" />
                </span>
            )}
            <span className="truncate">{motivo.texto}</span>
        </span>
    )
}

// Classes literais (o Tailwind não enxerga `sm:grid-cols-${n}`); evita coluna vazia com menos de 3 cartões.
const COLUNAS: Record<number, string> = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' }

function dadosDe(post: WPPost) {
    return {
        titulo: stripHtml(post.title.rendered),
        imagem: getWPImage(post._embedded, post.featured_image_url),
        minutos: post.acf?.reading_time ?? readingTime(post.content?.rendered ?? ''),
        resumo: stripHtml(post.excerpt?.rendered ?? ''),
    }
}

/**
 * Fim do artigo: o que ler a seguir, com forma de convite e não de rodapé.
 *
 * Medido em 2026-09 (Umami, 30 dias): o "Leia também" em lista compacta teve 12
 * cliques em ~2,3 mil leituras. Aqui o primeiro sugerido ocupa a largura toda,
 * com imagem grande e o MOTIVO da sugestão (entidade em comum, senão categoria).
 * Imagens com proporção fixa reservam a altura antes de carregar: sem salto de
 * layout no ponto em que o leitor está rolando.
 */
export function BlogContinuar({ atual, candidatos, verMaisHref }: Props) {
    const [destaque, ...outros] = candidatos
    if (!destaque) return null
    const d = dadosDe(destaque)

    return (
        <section data-bloco="artigo-continuar" aria-labelledby="continuar-titulo" className="mt-10 border-t border-border px-4 pt-8 pb-10 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-end justify-between gap-4">
                <div className="min-w-0">
                    <p className="mb-1 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-accent">Continue por aqui</p>
                    <h2 id="continuar-titulo" className="font-serif text-[clamp(1.6rem,3vw,2.15rem)] font-semibold leading-none tracking-[-0.035em] text-foreground">
                        Para ler a seguir
                    </h2>
                </div>
                <Link href={verMaisHref} className="shrink-0 whitespace-nowrap font-mono text-[10px] font-black uppercase tracking-[0.12em] text-accent transition-colors hover:text-accent-strong">
                    Ver mais →
                </Link>
            </div>

            <Link href={`/blog/${destaque.slug}`} className="group grid gap-4 border border-border bg-surface transition-colors hover:border-accent/60 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <div className="relative aspect-video w-full overflow-hidden bg-background lg:aspect-auto lg:min-h-64">
                    {d.imagem && (
                        <Image src={d.imagem.src} alt={d.imagem.alt || d.titulo} fill sizes="(max-width: 1024px) 100vw, 55vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    )}
                </div>
                <div className="flex min-w-0 flex-col justify-center p-4 sm:p-6 lg:pl-2">
                    <Motivo atual={atual} candidato={destaque} categoria />
                    <span className="block text-[22px] font-black leading-tight tracking-[-0.02em] text-foreground transition-colors group-hover:text-accent sm:text-[28px]">
                        {d.titulo}
                    </span>
                    {d.resumo && (
                        <span className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted">{d.resumo}</span>
                    )}
                    <span className="mt-3 flex items-center gap-1.5 text-[12px] text-muted">
                        <Clock size={11} className="shrink-0" />
                        {d.minutos} min de leitura
                    </span>
                </div>
            </Link>

            {outros.length > 0 && (
                <div className={`mt-4 grid gap-4 ${COLUNAS[Math.min(outros.length, 3)]}`}>
                    {outros.slice(0, 3).map(post => {
                        const o = dadosDe(post)
                        return (
                            <Link key={post.id} href={`/blog/${post.slug}`}
                                className="group grid min-w-0 grid-cols-[112px_minmax(0,1fr)] gap-3 sm:grid-cols-1">
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface sm:aspect-video">
                                    {o.imagem && (
                                        <Image src={o.imagem.src} alt={o.imagem.alt || o.titulo} fill sizes="(max-width: 640px) 112px, 30vw"
                                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                                    )}
                                </div>
                                <div className="min-w-0 self-center sm:self-start">
                                    <Motivo atual={atual} candidato={post} categoria={false} />
                                    <span className="line-clamp-3 block text-[15px] font-bold leading-tight text-foreground transition-colors group-hover:text-accent">
                                        {o.titulo}
                                    </span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
