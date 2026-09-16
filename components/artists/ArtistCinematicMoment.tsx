import { useTranslations } from 'next-intl'
interface Props {
    statement: string
    sub?: string
    accent: string
    quote?: string
    quoteAuthor?: string
    quoteContext?: string
    quoteSourceUrl?: string
}

/**
 * Ruptura editorial entre a análise e a trajetória: a frase que resume a
 * carreira, tratada como declaração tipográfica.
 *
 * Antes era um bloco full-bleed com retrato de fundo. O retrato entrava com
 * `fill` num container de 280–340px de altura, então uma foto vertical virava
 * uma faixa recortada em pedaço de rosto que não informava nada — e o texto por
 * cima exigia três camadas de overlay para ficar legível, com o eyebrow em
 * accent brigando com as áreas claras. Pior: o bloco inteiro era condicionado à
 * existência da foto, então perfis sem imagem dedicada perdiam a frase.
 *
 * Aqui a frase carrega sozinha, com a citação de abertura na margem.
 */
export function ArtistCinematicMoment({ statement, sub, accent, quote, quoteAuthor, quoteContext, quoteSourceUrl }: Props) {
    const t = useTranslations('profile.ui')
    if (!statement) return null
    const hasQuote = Boolean(quote && quoteAuthor)

    return (
        <section className="border-t border-border/70 py-12 sm:py-16">
            {/* Sempre em díptico: a frase à esquerda, o apoio à direita. Sem
                citação, o texto de apoio ocupa a coluna que ficava vazia em vez de
                descer — o bloco deixa de ser uma coluna só com metade da largura
                sobrando. A medida da frase sobe para 26ch: em 20ch ela quebrava em
                quatro linhas curtas, com o travessão órfão abrindo linha. */}
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
                <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>
                        {t('inOneSentence')}
                    </p>
                    <h2 className="mt-5 max-w-[26ch] font-serif text-[clamp(1.75rem,4.2vw,3rem)] font-medium leading-[1.08] tracking-[-0.02em] text-foreground">
                        {statement}
                    </h2>
                    {/* Com citação, a coluna direita é dela — o apoio volta para cá. */}
                    {sub && hasQuote && (
                        <p className="mt-6 max-w-[58ch] text-[15px] leading-[1.75] text-foreground/70">{sub}</p>
                    )}
                </div>

                {sub && !hasQuote && (
                    <p className="max-w-[46ch] text-[15px] leading-[1.75] text-foreground/70 lg:pt-2">{sub}</p>
                )}

                {hasQuote && (
                    <blockquote className="border-t border-border/70 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-1">
                        <p className="font-serif text-[19px] font-medium leading-normal tracking-[-0.01em] text-foreground/90 sm:text-[21px]">
                            “{quote}”
                        </p>
                        <footer className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <cite className="font-mono text-[10px] font-black uppercase not-italic tracking-widest" style={{ color: accent }}>
                                {quoteAuthor}
                            </cite>
                            {quoteContext && (
                                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">{quoteContext}</span>
                            )}
                            {quoteSourceUrl && (
                                <a href={quoteSourceUrl} target="_blank" rel="noopener noreferrer"
                                    className="font-mono text-[9px] font-black uppercase tracking-widest text-muted underline decoration-border underline-offset-4 hover:text-foreground">
                                    {t('readSource')}
                                </a>
                            )}
                        </footer>
                    </blockquote>
                )}
            </div>
        </section>
    )
}
