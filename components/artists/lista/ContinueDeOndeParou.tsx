'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { getServerConsent, recusouConsentimento, subscribeConsent } from '@/lib/consent'
import { assinarRecentes, interpretarRecentes, lerRecentesCru, limparRecentes } from '@/lib/artists/recentes'

const SERIF = 'font-[family-name:var(--font-playfair)]'

/** Faixa dos últimos artistas vistos. Não aparece para quem nunca abriu uma ficha. */
export function ContinueDeOndeParou() {
    // No servidor e na hidratação o snapshot é vazio: a faixa só aparece depois, sem descompasso de HTML.
    const cru = useSyncExternalStore(assinarRecentes, lerRecentesCru, () => '')
    // Quem recusa o consentimento não vê a faixa e tem o histórico já guardado apagado (nunca no servidor: snapshot falso).
    const recusou = useSyncExternalStore(subscribeConsent, recusouConsentimento, () => getServerConsent() !== null)
    useEffect(() => { if (recusou) limparRecentes() }, [recusou])
    const itens = useMemo(() => (recusou ? [] : interpretarRecentes(cru).slice(0, 4)), [cru, recusou])
    if (itens.length === 0) return null
    return (
        <section aria-labelledby="continue-titulo" data-bloco="lista-continue" className="page-wrap pt-5">
            <div className="flex items-baseline justify-between gap-4">
                <h2 id="continue-titulo" className={`${SERIF} text-[22px] font-semibold leading-tight sm:text-[26px]`}>Continue de onde parou</h2>
                <button type="button" onClick={limparRecentes} className="touch-target text-[13px] font-semibold text-muted hover:text-foreground">Limpar</button>
            </div>
            <ul className="-mx-4 mt-3.5 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:px-0">
                {itens.map((r, i) => (
                    <li key={`${r.tipo ?? 'artista'}:${r.slug}`} className="w-[200px] shrink-0 sm:w-auto">
                        <Link href={`/${r.tipo === 'grupo' ? 'groups' : 'artists'}/${r.slug}`} data-posicao={i + 1} className="flex items-center gap-3 border border-border bg-surface p-2 hover:border-accent/60 sm:gap-3.5 sm:p-2.5">
                            <span className="relative h-16 w-12 shrink-0 overflow-hidden bg-background sm:h-[72px] sm:w-14">
                                {r.foto && <Image src={r.foto} alt="" fill sizes="56px" className="object-cover object-top" />}
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-[14px] font-bold sm:text-[15px]">{r.nome}</span>
                                {r.papel && <span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-[0.08em] text-muted sm:text-[10px]">{r.papel}</span>}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    )
}
