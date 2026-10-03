import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, ChevronRight } from 'lucide-react'
import { stripHtml } from '@/lib/utils'
import type { AgencyView } from '@/app/(site)/agencies/[slug]/lib/carregarAgencia'

export function AgencyHistory({ view }: { view: AgencyView }) {
    const { name, originYear, narrativeChapters } = view
    return (
        <section id="historia" className="scroll-mt-(--scroll-anchor-offset,106px) overflow-clip border border-border bg-foreground text-background">
            <div className="grid lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
                <header className="relative border-b border-background/15 p-6 sm:p-8 lg:border-b-0 lg:border-r">
                    <div className="lg:sticky lg:top-[220px]">
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.17em] text-(--ac-brand)">A história em capítulos</p>
                        <h2 className="mt-4 max-w-md text-4xl font-black leading-[0.96] tracking-tighter sm:text-5xl">
                            As viradas que definiram a {name}.
                        </h2>
                        <p className="mt-6 max-w-sm text-sm leading-7 text-background/65">
                            Uma leitura da formação da empresa, das viradas de catálogo e do ciclo que começa agora.
                        </p>
                        <div className="mt-8 flex items-end gap-3 border-t border-background/15 pt-5">
                            <strong className="font-mono text-4xl leading-none">{originYear ? new Date().getFullYear() - originYear : narrativeChapters.length}</strong>
                            <span className="max-w-[130px] font-mono text-[8px] uppercase leading-4 tracking-[0.12em] text-background/45">
                                {originYear ? 'anos de trajetória documentada' : 'capítulos documentados'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="divide-y divide-background/15">
                    {narrativeChapters.map((chapter, index) => (
                        <article
                            key={`${chapter.period}-${chapter.title}`}
                            id={`capitulo-${index + 1}`}
                            className="group/chapter relative flex scroll-mt-(--scroll-anchor-offset,106px) flex-col border-l-2 border-transparent transition-colors duration-500 target:border-(--ac-brand) target:bg-background/4 lg:block"
                        >
                            {chapter.imageSrc && (
                                <figure className="relative order-2 aspect-16/10 overflow-hidden sm:aspect-16/8 lg:order-1">
                                    <Image
                                        src={chapter.imageSrc}
                                        alt={chapter.visual_alt || chapter.title}
                                        fill
                                        className="object-cover object-center opacity-80 transition duration-700 group-hover/chapter:scale-[1.025] group-hover/chapter:opacity-95 motion-reduce:transition-none"
                                        sizes="(max-width: 1024px) 100vw, 64vw"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/10 to-transparent" />
                                    {(chapter.visual_credit || chapter.relatedGroup) && (
                                        <figcaption className="absolute bottom-3 left-4 font-mono text-[8px] uppercase tracking-[0.12em] text-white/55">
                                            {chapter.visual_credit || stripHtml(chapter.relatedGroup!.title.rendered)}
                                        </figcaption>
                                    )}
                                </figure>
                            )}
                            <div className="relative order-1 p-6 sm:p-8 lg:order-2">
                                <span aria-hidden="true" className="absolute right-5 top-4 font-mono text-6xl font-black leading-none text-background/5.5">0{index + 1}</span>
                                <p className="font-mono text-[11px] font-black tracking-[0.08em] text-(--ac-brand)">{chapter.period}</p>
                                <h3 className="mt-4 max-w-2xl text-2xl font-black leading-tight tracking-[-0.035em] sm:text-3xl">{chapter.title}</h3>
                                <p className="mt-4 max-w-2xl text-[14px] leading-7 text-background/68">{chapter.description}</p>
                                <div className="mt-6 flex flex-wrap gap-4 font-mono text-[8px] font-black uppercase tracking-[0.11em]">
                                    <a href={chapter.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-background/45 hover:text-background">
                                        Fonte do capítulo <ExternalLink size={9} />
                                    </a>
                                    {chapter.relatedGroup && (
                                        <Link href={`/groups/${chapter.relatedGroup.slug}`} prefetch={false} className="inline-flex items-center gap-1 text-background/45 hover:text-background">
                                            Ver perfil relacionado <ChevronRight size={9} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}
