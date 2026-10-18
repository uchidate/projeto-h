import type { ReactNode } from 'react'
import { Award, Medal } from 'lucide-react'
import type { ArtistAward } from '@/lib/profiles/structuredFields'

interface Props {
    awards: ArtistAward[]
    kicker: string
    title: string
    labels: { won: string; nominated: string }
    /** Preenche as células vazias da última fileira (desktop, 3 colunas); não aparece quando a grade fecha certinha. */
    preencher?: ReactNode
}

/** Dourado para quem venceu, azul-acinzentado para indicação: a cor diz o resultado antes da leitura. */
const TONS = {
    won: { cor: '#b8860b', texto: 'text-amber-800 dark:text-amber-400', fundo: 'rgba(212, 160, 23, 0.12)', borda: 'rgba(212, 160, 23, 0.45)' },
    nominated: { cor: '#5b6b8c', texto: 'text-slate-600 dark:text-slate-300', fundo: 'rgba(124, 138, 165, 0.12)', borda: 'rgba(124, 138, 165, 0.45)' },
} as const

const SEM_TITULO = /^[—–-]*$/

const INDICADO = /indicad|nomine|nomination|finalist/i

export function foiIndicacao(a: ArtistAward): boolean {
    return INDICADO.test(`${a.category} ${a.title} ${a.event}`)
}

/**
 * Prêmios em selos: ano grande, resultado em cor (vencedor/indicado) e o evento
 * como etiqueta. Só aparece quando o artista tem prêmio cadastrado.
 */
export function PremiosSelos({ awards, kicker, title, labels, preencher }: Props) {
    if (awards.length === 0) return null
    const ordenados = [...awards].sort((a, b) => Number(b.year) - Number(a.year) || 0)
    return (
        <section id="premios" data-bloco="ficha-premios" className="scroll-mt-28 border-t border-border py-12 sm:py-[72px]">
            <div className="page-wrap">
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-muted">{kicker}</p>
                <h2 className="mt-2 font-black text-[26px] leading-tight sm:text-[32px]">{title}</h2>
                <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {ordenados.map((a, i) => {
                        const indicado = foiIndicacao(a)
                        const tom = TONS[indicado ? 'nominated' : 'won']
                        const Icone = indicado ? Medal : Award
                        return (
                            <li key={`${a.year}-${i}`} className="flex gap-4 rounded-xl border p-4" style={{ borderColor: tom.borda, background: tom.fundo }}>
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: tom.cor, color: '#fff' }}>
                                    <Icone size={22} aria-hidden />
                                </span>
                                <span className="min-w-0">
                                    <span className="flex items-baseline gap-2">
                                        <span className={`font-mono text-[18px] font-black leading-none ${tom.texto}`}>{a.year}</span>
                                        <span className={`font-mono text-[10px] font-black uppercase tracking-[0.12em] ${tom.texto}`}>{indicado ? labels.nominated : labels.won}</span>
                                    </span>
                                    <span className="mt-1.5 block text-[15px] font-black leading-snug">{a.category}</span>
                                    {!SEM_TITULO.test(a.title) && <span className="mt-0.5 block text-[13px] italic leading-snug text-foreground-subtle">{a.title}</span>}
                                    {a.event && <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-muted">{a.event}</span>}
                                </span>
                            </li>
                        )
                    })}
                {preencher && ordenados.length % 3 !== 0 && (
                        <li className={`hidden lg:block ${ordenados.length % 3 === 1 ? 'col-span-2' : ''}`}>{preencher}</li>
                    )}
                </ul>
            </div>
        </section>
    )
}
