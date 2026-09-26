import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import type { WPTerm } from '@/lib/wordpress/types'
import { href } from '@/lib/i18n/routes'
import { AtribuicaoJustWatch } from '@/components/productions/AtribuicaoJustWatch'

interface Props {
    title: string
    synopsis: string
    genres: WPTerm[]
    platforms: WPTerm[]
}

/**
 * Resumo logo abaixo do hero: o que quem chegou por busca quer saber em cinco
 * segundos — sinopse, gêneros, ONDE ASSISTIR e (no celular) quem atua.
 *
 * Na estrutura anterior a sinopse ficava a mais de 800 px de rolagem e o "onde
 * assistir" era um texto solto na faixa de métricas, escondido no celular (`hidden
 * sm:flex`), que é 83% do tráfego. Aqui ele é um cartão próprio e vem ANTES da
 * sinopse no celular (`order`): é a pergunta de maior intenção. O elenco vem logo
 * depois, no `ProductionElencoB`.
 *
 * Cada parte tem `data-bloco` próprio: a medição guarda só o caminho do destino, e
 * sem isso o clique em plataforma e o clique em ator seriam o mesmo bloco.
 *
 * O cartão de plataformas só existe com dado: em 2026-09 o catálogo inteiro não tinha
 * nenhuma, e uma caixa vazia em toda página seria pior que nada.
 */
export function ProductionResumo({ title, synopsis, genres, platforms }: Props) {
    const t = useTranslations('profile.production')
    const locale = useLocale()
    const listagem = href('productions', undefined, locale)
    const temCartao = platforms.length > 0

    return (
        <section data-bloco="ficha-producao-resumo" aria-label={t('summary.summaryLabel', { title })} className="border-b border-border pb-8 pt-6 lg:pb-12 lg:pt-11">
            <div className={`grid gap-6 ${temCartao ? 'lg:grid-cols-[minmax(0,1fr)_430px] lg:gap-16' : ''}`}>
                <div className="min-w-0 lg:order-first">
                    <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-muted">{t('summary.about')}</p>
                    {synopsis && <p className="max-w-[760px] text-[17px] leading-relaxed text-foreground/90 lg:text-[22px] lg:leading-[1.6]">{synopsis}</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-2.5 lg:mt-6">
                        {genres.map(g => (
                            <Link key={g.id} href={`${listagem}?genre=${g.slug}`}
                                className="border border-border-strong px-3.5 py-2 text-[13px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">
                                {g.name}
                            </Link>
                        ))}
                        <a href="#dossie" className="ml-1 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-accent hover:text-accent-strong">
                            {t('summary.readFull')} ↓
                        </a>
                    </div>
                </div>

                {temCartao && (
                    <div data-bloco="ficha-producao-onde-assistir" className="order-first min-w-0 self-start border border-border bg-surface p-4 sm:p-6 lg:order-none">
                        <h2 className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-muted lg:mb-4">{t('summary.whereToWatch')}</h2>
                        <div className="flex flex-col gap-2.5">
                            {platforms.map(p => (
                                <Link key={p.id} href={`${listagem}?platform=${p.slug}`}
                                    className="flex items-center justify-between gap-4 border border-border-strong bg-background px-4 py-3.5 transition-colors hover:border-accent/60">
                                    <span className="text-[16px] font-bold text-foreground">{p.name}</span>
                                    <span aria-hidden="true" className="text-[18px] text-accent">→</span>
                                </Link>
                            ))}
                        </div>
                        <AtribuicaoJustWatch className="mt-3.5 block" />
                    </div>
                )}
            </div>
        </section>
    )
}
