import Image from 'next/image'
import Link from 'next/link'

export type Marco = {
    ano: number
    tipo: 'obra' | 'fase' | 'premio' | 'estreia'
    titulo: string
    href?: string
    /** Pôster da obra (obras com imagem ganham cartão ilustrado). */
    img?: string
    /** Nota da obra (0-10), exibida ao lado do pôster. */
    nota?: number
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

const ICONES: Record<Marco['tipo'], string> = { estreia: '★', fase: '◆', obra: '▶', premio: '🏆' }

/**
 * Linha do tempo horizontal por ano: trilho contínuo, ano grande e cartões ilustrados
 * (obras com pôster e nota, prêmios em dourado, estreia em destaque com a cor do artista).
 * Cada marco com link leva à página da obra. HTML estático, rolagem com snap no celular.
 */
export function MarcosFaixa({ marcos, tipos, ariaLabel, accent }: Props) {
    const porAno = new Map<number, Marco[]>()
    for (const m of [...marcos].sort((a, b) => a.ano - b.ano)) {
        porAno.set(m.ano, [...(porAno.get(m.ano) ?? []), m])
    }
    return (
        <div className="relative -mx-4 sm:mx-0">
            <ol aria-label={ariaLabel} className="relative flex snap-x snap-mandatory scroll-pl-5 overflow-x-auto px-5 pb-6 pt-1 sm:scroll-pl-1 sm:px-1">
                {[...porAno.entries()].map(([ano, itens]) => (
                    <li key={ano} className="relative w-[236px] shrink-0 snap-start pr-5 sm:w-[256px]">
                        <div className="relative flex h-14 items-end">
                            <span aria-hidden className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, ${accent}, color-mix(in srgb, ${accent} 20%, transparent))` }} />
                            <span aria-hidden className="absolute -bottom-[5px] left-0 h-[11px] w-[11px] rounded-full ring-4 ring-[var(--color-bg)]" style={{ background: accent }} />
                            <span className="pb-3 font-[family-name:var(--font-playfair)] text-[40px] font-black leading-none tracking-tight" style={{ color: accent }}>{ano}</span>
                        </div>
                        <ul className="mt-5 space-y-2.5">
                            {itens.slice(0, 4).map((m, i) => {
                                const conteudo = (
                                    <>
                                        {m.img ? (
                                            <Image src={m.img} alt="" width={56} height={80} sizes="56px" className="h-20 w-14 shrink-0 object-cover shadow-md" />
                                        ) : (
                                            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center text-[15px]" style={m.tipo === 'estreia' ? { background: '#0d0b0f', color: accent } : { background: 'color-mix(in srgb, currentColor 10%, transparent)' }}>{ICONES[m.tipo]}</span>
                                        )}
                                        <span className="min-w-0">
                                            <span className="block font-mono text-[10px] font-black uppercase tracking-[0.14em] opacity-70">{tipos[m.tipo]}</span>
                                            <span className="mt-0.5 line-clamp-3 block text-[14px] font-bold leading-snug">{m.titulo}</span>
                                            {m.nota != null && m.nota > 0 && <span className="mt-1 block font-mono text-[12px] font-bold" style={{ color: accent }}>★ {m.nota.toFixed(1)}</span>}
                                        </span>
                                    </>
                                )
                                const base = 'flex items-start gap-3 p-3 transition-transform'
                                const estilo = m.tipo === 'estreia'
                                    ? { className: `${base} text-[#0d0b0f]`, style: { background: accent } }
                                    : m.tipo === 'premio'
                                        ? { className: `${base} text-foreground`, style: { background: 'color-mix(in srgb, #f5b301 14%, var(--color-surface))', boxShadow: 'inset 3px 0 0 #f5b301' } }
                                        : { className: `${base} bg-surface text-foreground`, style: { boxShadow: `inset 3px 0 0 ${m.tipo === 'fase' ? 'var(--color-border-strong)' : accent}` } }
                                return (
                                    <li key={`${m.tipo}-${i}`}>
                                        {m.href ? (
                                            <Link href={m.href} className={`${estilo.className} hover:-translate-y-0.5 hover:shadow-lg`} style={estilo.style}>{conteudo}</Link>
                                        ) : (
                                            <div className={estilo.className} style={estilo.style}>{conteudo}</div>
                                        )}
                                    </li>
                                )
                            })}
                            {itens.length > 4 && <li className="pl-1 text-[12px] text-muted">+{itens.length - 4}</li>}
                        </ul>
                    </li>
                ))}
            </ol>
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-[var(--color-bg)] to-transparent sm:block" />
        </div>
    )
}
