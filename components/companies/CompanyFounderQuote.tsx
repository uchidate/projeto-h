interface Props {
    quote: string
    author: string
    context?: string
    accent: string
}

/** Citação de capa — mesma linguagem visual do GroupPullQuote, sem next-intl (ficha de empresa é só PT). */
export function CompanyFounderQuote({ quote, author, context, accent }: Props) {
    return (
        <section aria-label={`Citação de ${author}`} className="relative overflow-hidden border border-border bg-featured px-6 py-7 text-featured-fg sm:px-10 sm:py-9">
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
                </footer>
            </blockquote>
        </section>
    )
}
