import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, ChevronRight } from 'lucide-react'
import { stripHtml } from '@/lib/utils'
import type { AgencyView } from '@/app/(site)/agencies/[slug]/lib/carregarAgencia'

export function AgencyVisualEssay({ view }: { view: AgencyView }) {
    const { name, mark, interfaceAccent, editorialVisualStories } = view
    return (
        <section aria-labelledby="ensaio-visual-agencia" className="overflow-hidden border border-border bg-surface">
            <div className="grid lg:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
                <div className="relative flex min-h-[340px] flex-col justify-between overflow-hidden bg-foreground p-6 text-background sm:min-h-[430px] sm:p-8 lg:min-h-[620px]">
                    <div aria-hidden="true" className="absolute -right-8 -top-10 z-0 font-black text-[160px] leading-none text-background opacity-[0.055] sm:text-[220px]">
                        {mark}
                    </div>
                    <div className="relative z-10">
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-(--ac-brand)">Leitura visual</p>
                        <h2 id="ensaio-visual-agencia" className="mt-4 max-w-lg text-3xl font-black leading-[0.98] tracking-[-0.045em] sm:text-5xl">
                            A identidade da {name}, vista de perto.
                        </h2>
                    </div>
                    <ol className="relative z-10 my-10 hidden border-y border-background/15 py-3 lg:block">
                        {editorialVisualStories.map((story, index) => (
                            <li key={`${story.title}-index`} className="flex items-center gap-4 border-b border-background/10 py-3 last:border-b-0">
                                <span className="font-mono text-[9px] text-background/35">0{index + 1}</span>
                                <span className="text-sm font-black text-background/70">{story.title}</span>
                            </li>
                        ))}
                    </ol>
                    <div className="relative z-10 max-w-md border-t border-background/20 pt-5">
                        <p className="text-[14px] leading-7 text-background/70 sm:text-[15px]">
                            Imagens, espaços e artistas ajudam a revelar como a empresa transforma uma direção criativa em presença reconhecível.
                        </p>
                        <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-background/45">
                            {editorialVisualStories.length} capítulos visuais
                        </p>
                        <p className="mt-2 flex items-center gap-2 font-mono text-[8px] font-black uppercase tracking-[0.12em] text-background/55 lg:hidden">
                            Deslize para explorar <span aria-hidden="true">→</span>
                        </p>
                    </div>
                </div>

                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain p-3 scrollbar-none [&::-webkit-scrollbar]:hidden lg:block lg:divide-y lg:divide-border lg:p-0">
                    {editorialVisualStories.map((story, index) => {
                        const groupName = story.group ? stripHtml(story.group.title.rendered) : null
                        return (
                            <article
                                key={`${story.title}-${index}`}
                                className="group/story min-w-[88%] snap-center overflow-hidden border border-border bg-background lg:grid lg:min-h-[340px] lg:min-w-0 lg:grid-cols-[minmax(220px,0.92fr)_minmax(0,1.08fr)] lg:border-0"
                            >
                                <figure className="relative min-h-[250px] overflow-hidden lg:min-h-full">
                                    <Image
                                        src={story.image.src}
                                        alt={story.visual_alt || (groupName ? `${groupName}, grupo relacionado à ${name}` : '')}
                                        fill
                                        className="object-cover object-center transition duration-700 group-hover/story:scale-[1.045] group-hover/story:saturate-[1.1] motion-reduce:transition-none"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 40vw, 28vw"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-transparent" />
                                    <figcaption className="absolute inset-x-0 bottom-0 p-4 text-[10px] leading-5 text-white/80">
                                        <span className="block font-mono text-[8px] font-black uppercase tracking-[0.12em] text-white/55">
                                            {story.visual_credit || groupName}
                                        </span>
                                        {story.visual_caption && <span className="mt-1 block max-w-sm">{story.visual_caption}</span>}
                                    </figcaption>
                                </figure>
                                <div className="relative flex flex-col justify-between p-5 sm:p-7">
                                    <span aria-hidden="true" className="absolute right-4 top-2 font-mono text-[58px] font-black leading-none text-foreground/[0.035]">0{index + 1}</span>
                                    <div className="relative">
                                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-(--ac)">Capítulo 0{index + 1}</p>
                                        <h3 className="mt-5 text-2xl font-black leading-tight tracking-[-0.035em]">{story.title}</h3>
                                        {story.quote_text && story.quote_author && (
                                            <blockquote className="mt-5 border-l-2 pl-4" style={{ borderColor: interfaceAccent }}>
                                                <p className="font-serif text-xl font-bold leading-snug tracking-tight text-foreground/90">
                                                    “{story.quote_text}”
                                                </p>
                                                <footer className="mt-3">
                                                    <cite className="not-italic">
                                                        <span className="block text-[11px] font-black text-foreground">{story.quote_author}</span>
                                                        {story.quote_context && <span className="mt-0.5 block font-mono text-[8px] uppercase leading-4 tracking-widest text-muted">{story.quote_context}</span>}
                                                    </cite>
                                                    {story.quote_source_url && (
                                                        <a href={story.quote_source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-mono text-[8px] font-black uppercase tracking-widest text-muted underline decoration-border underline-offset-4 hover:text-(--ac)">
                                                            Ler citação na fonte <ExternalLink size={9} />
                                                        </a>
                                                    )}
                                                </footer>
                                            </blockquote>
                                        )}
                                        <p className="mt-3 hidden text-[13px] leading-6 text-foreground/68 lg:block">{story.description}</p>
                                        <details className="group/details mt-5 border-t border-border pt-3 lg:hidden">
                                            <summary className="flex cursor-pointer list-none items-center justify-between font-mono text-[9px] font-black uppercase tracking-widest text-muted marker:content-none">
                                                Contexto
                                                <span aria-hidden="true" className="text-base font-light transition-transform group-open/details:rotate-45">+</span>
                                            </summary>
                                            <p className="mt-3 text-[13px] leading-6 text-foreground/68">{story.description}</p>
                                        </details>
                                    </div>
                                    <div className="relative mt-6 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[9px] font-black uppercase tracking-widest">
                                        {story.visual_source_url && (
                                            <a href={story.visual_source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-(--ac)">
                                                Fonte da imagem <ExternalLink size={10} />
                                            </a>
                                        )}
                                        {groupName && !story.hasCuratedVisual && (
                                            <Link href={`/groups/${story.group!.slug}`} prefetch={false} className="inline-flex items-center gap-1 text-muted hover:text-(--ac)">
                                                Ver {groupName} <ChevronRight size={10} />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
