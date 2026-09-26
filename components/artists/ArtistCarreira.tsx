import { useTranslations } from 'next-intl'
import { ExternalLink } from 'lucide-react'
import type { WPGroup } from '@/lib/wordpress/types'
import type { ArtistAward } from '@/lib/profiles/structuredFields'

type Capitulo = NonNullable<NonNullable<WPGroup['acf']>['story_chapters']>[number]
type Metrica = NonNullable<NonNullable<WPGroup['acf']>['key_metrics']>[number]

interface Props {
    id: string
    eyebrow: string
    titulo: string
    tituloPremios: string
    capitulos: Capitulo[]
    metricas: Metrica[]
    premios: ArtistAward[]
    accent: string
}

/**
 * Carreira da ficha C: números, linha do tempo e prêmios numa seção só, no mesmo eixo do topo,
 * sem caixas. Substitui trajetória (galeria de eras + capítulos), recordes e prêmios, que
 * contavam os mesmos marcos em três blocos. Todo o texto e todos os links de fonte seguem no HTML.
 */
export function ArtistCarreira({ id, eyebrow, titulo, tituloPremios, capitulos, metricas, premios, accent }: Props) {
    const t = useTranslations('profile.ui')
    return (
        <section id={id} aria-labelledby={`${id}-titulo`} className="page-wrap scroll-mt-(--scroll-anchor-offset,106px) py-12 sm:py-16">
            <div className="border-t pt-5" style={{ borderColor: accent }}>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: accent }}>{eyebrow}</p>
                <h2 id={`${id}-titulo`} className="mt-2 text-[26px] font-black leading-tight tracking-[-0.03em] sm:text-[34px]">{titulo}</h2>
            </div>

            {metricas.length > 0 && (
                <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
                    {metricas.map(m => (
                        <div key={m.label} className="flex flex-col border-t border-border/70 pt-3">
                            <dt className="order-2 mt-2 text-[12px] leading-4 text-muted">{m.label}</dt>
                            <dd className="text-[26px] font-black leading-none tracking-[-0.03em] sm:text-[30px]" style={{ color: accent }}>{m.value}</dd>
                            {(m.context || m.as_of || m.source_url) && (
                                <p className="order-3 mt-2 text-[12px] leading-4 text-muted">
                                    {m.context}{m.context && m.as_of ? ' · ' : ''}{m.as_of}
                                    {m.source_url && (
                                        <a href={m.source_url} target="_blank" rel="noopener noreferrer" className="ml-1 underline decoration-border underline-offset-4 hover:text-foreground">{t('chapterSource')}</a>
                                    )}
                                </p>
                            )}
                        </div>
                    ))}
                </dl>
            )}

            <ol className="mt-10 border-t border-border/70">
                {capitulos.map((c, i) => (
                    <li key={`${i}-${c.period}`} className="grid gap-x-10 gap-y-2 border-b border-border/70 py-6 lg:grid-cols-[10rem_minmax(0,44rem)]">
                        <p className="font-mono text-[12px] font-black tracking-[0.06em]" style={{ color: accent }}>{c.period}</p>
                        <div>
                            <h3 className="text-[18px] font-black leading-snug tracking-[-0.02em]">{c.title}</h3>
                            <p className="mt-2 text-[15px] leading-7 text-foreground-subtle">{c.description}</p>
                            {c.quote_text && c.quote_author && (
                                <blockquote className="mt-3 border-l-2 pl-4 text-[14px] italic leading-6 text-foreground-subtle" style={{ borderColor: accent }}>
                                    “{c.quote_text}”
                                    <footer className="mt-1 text-[12px] not-italic text-muted">
                                        {c.quote_author}{c.quote_context ? ` · ${c.quote_context}` : ''}
                                    </footer>
                                </blockquote>
                            )}
                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] font-black uppercase tracking-[0.1em] text-muted">
                                <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                                    {t('chapterSource')} <ExternalLink size={10} />
                                </a>
                                {c.quote_source_url && (
                                    <a href={c.quote_source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                                        Ler citação na fonte <ExternalLink size={10} />
                                    </a>
                                )}
                            </div>
                            {c.visual_credit && <p className="mt-2 text-[11px] text-muted">{c.visual_credit}</p>}
                        </div>
                    </li>
                ))}
            </ol>

            {premios.length > 0 && (
                <div className="mt-12">
                    <h3 className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-muted">{tituloPremios}</h3>
                    <ul className="mt-4 grid gap-x-10 sm:grid-cols-2">
                        {premios.map((a, i) => (
                            <li key={i} className="flex gap-4 border-t border-border/70 py-4">
                                <span className="w-10 shrink-0 font-mono text-[12px] font-black" style={{ color: accent }}>{a.year}</span>
                                <span className="min-w-0 text-[14px] leading-snug">
                                    <span className="block font-black">{a.category}</span>
                                    {a.title && <span className="block italic text-foreground-subtle">{a.title}</span>}
                                    {a.event && <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.08em] text-muted">{a.event}</span>}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    )
}
