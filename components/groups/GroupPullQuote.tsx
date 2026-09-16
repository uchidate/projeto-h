import { useTranslations } from 'next-intl'
import { GroupGrainOverlay } from '@/components/groups/GroupGrainOverlay'

interface Props {
    quote: string
    author: string
    context?: string
    sourceUrl?: string
    accent: string
}

/** Citação de capa, estilo revista — abre a leitura com a voz de uma integrante. */
export function GroupPullQuote({ quote, author, context, sourceUrl, accent }: Props) {
    const t = useTranslations('profile.ui')
    return (
        <section aria-label={t('quoteOf', { author })} className="relative overflow-hidden border border-border bg-featured px-6 py-7 text-featured-fg sm:px-10 sm:py-9">
            <GroupGrainOverlay opacity={0.05} />
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -left-2 -top-5 select-none font-serif text-[110px] font-black leading-none sm:text-[150px]"
                style={{ color: accent, opacity: 0.14 }}
            >
                &ldquo;
            </span>
            <blockquote className="relative mx-auto max-w-3xl">
                <p className="font-serif text-[19px] font-bold leading-[1.35] tracking-[-0.02em] sm:text-[26px]">
                    {quote}
                </p>
                <footer className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <cite className="not-italic font-mono text-[11px] font-black uppercase tracking-widest" style={{ color: accent }}>
                        {author}
                    </cite>
                    {context && <span className="font-mono text-[9px] uppercase tracking-widest text-featured-muted">{context}</span>}
                    {sourceUrl && (
                        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[9px] font-black uppercase tracking-widest text-featured-muted underline decoration-featured-border underline-offset-4 hover:text-featured-fg">
                            {t('readSource')}
                        </a>
                    )}
                </footer>
            </blockquote>
        </section>
    )
}
