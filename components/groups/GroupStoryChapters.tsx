import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import type { WPGroup } from '@/lib/wordpress/types'
import { GroupGrainOverlay } from '@/components/groups/GroupGrainOverlay'

type Chapter = NonNullable<NonNullable<WPGroup['acf']>['story_chapters']>[number]

interface Props {
    chapters: Chapter[]
    accent: string
    groupName: string
    portrait?: { src: string; alt: string } | null
    debutYear?: number | null
    /** Ano em que a carreira parou de correr — morte do artista ou fim do grupo.
     *  Sem isso a contagem segue até hoje e um perfil póstumo mostra anos a mais. */
    endYear?: number | null
}

export function GroupStoryChapters({ chapters, accent, groupName, portrait, debutYear, endYear }: Props) {
    const t = useTranslations('profile.ui')
    const yearsDocumented = debutYear ? (endYear ?? new Date().getFullYear()) - debutYear : null
    return (
        <div className="relative overflow-hidden border border-border bg-featured text-featured-fg">
            <GroupGrainOverlay opacity={0.045} />
            <header className="relative grid gap-0 border-b border-featured-border lg:grid-cols-[minmax(0,1.35fr)_minmax(200px,0.65fr)]">
                <div className="flex flex-col justify-between p-6 sm:p-8">
                    <div>
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.17em]" style={{ color: accent }}>{t('storyEyebrow')}</p>
                        <h3 className="mt-4 max-w-md font-serif text-3xl font-medium leading-[1.04] tracking-[-0.02em] sm:text-4xl">
                            {t('storyHeading', { name: groupName })}
                        </h3>
                        <p className="mt-5 max-w-sm text-sm leading-7 text-featured-muted">
                            {/* Neutro de propósito: o mesmo componente serve dossiê de grupo e de
                                artista solo, e "das próprias integrantes" saía no feminino plural
                                em perfil de artista individual (visto em Kang Daniel). */}
                            {t('storyIntro')}
                        </p>
                    </div>
                    {/* Sem numeral fantasma atrás: eram 110px dentro de uma caixa de
                        ~60px com overflow-hidden, então o glifo saía sempre cortado
                        pela borda superior e lia como defeito. A cifra real carrega. */}
                    <div className="mt-8 flex items-end gap-3 border-t border-featured-border pt-5">
                        <strong className="font-mono text-4xl leading-none">{yearsDocumented ?? chapters.length}</strong>
                        <span className="max-w-[140px] font-mono text-[8px] uppercase leading-4 tracking-[0.12em] text-featured-muted">
                            {yearsDocumented ? t('yearsDocumented') : t('chaptersDocumented')}
                        </span>
                    </div>
                </div>
                {portrait && (
                    <figure className="relative min-h-[260px] overflow-hidden border-t border-featured-border lg:border-l lg:border-t-0">
                        <Image src={portrait.src} alt={portrait.alt} fill className="object-cover object-top" sizes="(max-width: 1024px) 100vw, 24vw" />
                        <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
                        <figcaption className="absolute bottom-2.5 left-3.5 font-mono text-[8px] uppercase tracking-[0.12em] text-white/60">
                            {groupName} · imagem oficial
                        </figcaption>
                    </figure>
                )}
            </header>

            <ol className="relative divide-y divide-featured-border">
                {chapters.map((chapter, index) => {
                    const hasQuote = !!(chapter.quote_text && chapter.quote_author)
                    // Capítulo com imagem + citação vira spotlight: a fala entra sobre a
                    // própria foto (efeito editorial de revista) em vez de repetida abaixo.
                    const quoteOnPhoto = hasQuote && !!chapter.visual_url

                    return (
                    <li
                        key={`${chapter.period}-${chapter.title}`}
                        id={`era-${index}`}
                        className="group/chapter scroll-mt-(--scroll-anchor-offset,106px) target:bg-white/4"
                    >
                    {/* Capítulo simples (sem citação sobre a foto) fica compacto: imagem
                        ao lado do texto em telas largas, em vez de empilhada em altura total. */}
                    <div className={quoteOnPhoto || !chapter.visual_url ? '' : 'lg:flex lg:items-stretch'}>
                        {chapter.visual_url && (
                            <figure className={`relative overflow-hidden bg-black ${quoteOnPhoto ? 'aspect-3/4 sm:aspect-21/9' : 'aspect-4/3 sm:aspect-video lg:aspect-auto lg:w-[300px] lg:shrink-0'}`}>
                                {/* Fundo desfocado com a própria capa — a imagem principal aparece inteira, sem corte */}
                                <Image
                                    aria-hidden="true"
                                    src={chapter.visual_url}
                                    alt=""
                                    fill
                                    className={`scale-125 object-cover object-center blur-2xl ${quoteOnPhoto ? 'opacity-65' : 'opacity-50'}`}
                                    sizes="(max-width: 1024px) 100vw, 62vw"
                                />
                                <Image
                                    src={chapter.visual_url}
                                    alt={chapter.visual_alt || chapter.title}
                                    fill
                                    className="object-contain object-center transition duration-700 group-hover/chapter:scale-[1.02] motion-reduce:transition-none"
                                    sizes="(max-width: 1024px) 100vw, 62vw"
                                />
                                {quoteOnPhoto && (
                                    <>
                                        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" />
                                        <blockquote className="absolute inset-x-0 bottom-0 max-w-2xl p-6 sm:p-8">
                                            <p className="font-serif text-xl font-bold leading-snug tracking-[-0.02em] text-white sm:text-2xl">
                                                “{chapter.quote_text}”
                                            </p>
                                            <footer className="mt-2.5">
                                                <cite className="not-italic">
                                                    <span className="block text-[11px] font-black text-white">{chapter.quote_author}</span>
                                                    {chapter.quote_context && <span className="mt-0.5 block font-mono text-[8px] uppercase leading-4 tracking-widest text-white/60">{chapter.quote_context}</span>}
                                                </cite>
                                            </footer>
                                        </blockquote>
                                    </>
                                )}
                                {chapter.visual_credit && (
                                    <figcaption className={`absolute inset-x-0 bg-black/55 px-3.5 py-2 font-mono text-[8px] uppercase tracking-[0.12em] text-white/60 backdrop-blur-xs ${quoteOnPhoto ? 'top-0' : 'bottom-0'}`}>
                                        {chapter.visual_credit}
                                    </figcaption>
                                )}
                            </figure>
                        )}
                        <div className={`relative p-6 sm:p-8 ${quoteOnPhoto || !chapter.visual_url ? '' : 'lg:min-w-0 lg:flex-1'}`}>
                            <span aria-hidden="true" className="absolute right-5 top-4 font-mono text-6xl font-black leading-none text-featured-fg/5.5">0{index + 1}</span>
                            <p className="font-mono text-[11px] font-black tracking-[0.08em]" style={{ color: accent }}>{chapter.period}</p>
                            <h4 className="mt-3 max-w-2xl font-serif text-xl font-medium leading-[1.14] tracking-[-0.02em] sm:text-2xl">{chapter.title}</h4>
                            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-featured-fg/70">{chapter.description}</p>
                            {hasQuote && !quoteOnPhoto && (
                                <blockquote className="mt-5 max-w-xl border-l-2 pl-4" style={{ borderColor: accent }}>
                                    <p className="font-serif text-lg font-bold leading-snug tracking-[-0.02em] text-featured-fg/90">
                                        “{chapter.quote_text}”
                                    </p>
                                    <footer className="mt-2.5">
                                        <cite className="not-italic">
                                            <span className="block text-[11px] font-black text-featured-fg">{chapter.quote_author}</span>
                                            {chapter.quote_context && <span className="mt-0.5 block font-mono text-[8px] uppercase leading-4 tracking-widest text-featured-muted">{chapter.quote_context}</span>}
                                        </cite>
                                    </footer>
                                </blockquote>
                            )}
                            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[8px] font-black uppercase tracking-[0.11em]">
                                <a href={chapter.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-featured-muted hover:text-featured-fg">
                                    {t('chapterSource')} <ExternalLink size={9} />
                                </a>
                                {chapter.quote_source_url && (
                                    <a href={chapter.quote_source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-featured-muted hover:text-featured-fg">
                                        Ler citação na fonte <ExternalLink size={9} />
                                    </a>
                                )}
                                {chapter.visual_source_url && (
                                    <a href={chapter.visual_source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-featured-muted hover:text-featured-fg">
                                        {t('imageSource')} <ExternalLink size={9} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    </li>
                    )
                })}
            </ol>
        </div>
    )
}
