import Link from 'next/link'

export type Marco = {
    ano: number
    tipo: 'obra' | 'fase' | 'premio' | 'estreia'
    titulo: string
    href?: string
}

interface Props {
    marcos: Marco[]
    tipos: Record<Marco['tipo'], string>
    ariaLabel: string
    accent: string
}

/** Marcos mínimos para a faixa aparecer: abaixo disso ela é só uma lista curta e não conta uma trajetória. */
export const MIN_MARCOS = 4

export function temMarcosSuficientes(marcos: Marco[]): boolean {
    return marcos.length >= MIN_MARCOS && new Set(marcos.map(m => m.ano)).size >= 2
}

/**
 * Faixa horizontal de marcos por ano: estreia, fases do dossiê, obras e prêmios.
 * Não repete conteúdo, só navega: cada marco com link leva à página da obra.
 * HTML estático, rolagem com snap no celular.
 */
export function MarcosFaixa({ marcos, tipos, ariaLabel, accent }: Props) {
    const porAno = new Map<number, Marco[]>()
    for (const m of [...marcos].sort((a, b) => a.ano - b.ano)) {
        porAno.set(m.ano, [...(porAno.get(m.ano) ?? []), m])
    }
    return (
        <ol aria-label={ariaLabel} className="-mx-4 flex snap-x snap-mandatory gap-0 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-1">
            {[...porAno.entries()].map(([ano, itens]) => (
                <li key={ano} className="relative w-[200px] shrink-0 snap-start border-l border-border pl-4 pr-4 sm:w-[220px]">
                    <span aria-hidden className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
                    <span className="font-mono text-[12px] font-black tracking-[0.06em]" style={{ color: accent }}>{ano}</span>
                    <ul className="mt-3 space-y-3">
                        {itens.slice(0, 4).map((m, i) => (
                            <li key={`${m.tipo}-${i}`}>
                                <span className="block font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">{tipos[m.tipo]}</span>
                                {m.href ? (
                                    <Link href={m.href} className="mt-0.5 block text-[14px] font-bold leading-snug hover:underline">{m.titulo}</Link>
                                ) : (
                                    <span className="mt-0.5 block text-[14px] font-bold leading-snug">{m.titulo}</span>
                                )}
                            </li>
                        ))}
                        {itens.length > 4 && <li className="text-[12px] text-muted">+{itens.length - 4}</li>}
                    </ul>
                </li>
            ))}
        </ol>
    )
}
