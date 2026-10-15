'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { trackRecirculacao } from '@/lib/analytics'

export interface NoMapa {
    href: string
    label: string
    img?: string | null
    tipo: 'grupo' | 'artista' | 'obra'
    /** Anel do nó. Padrão: obras fora, o resto dentro. */
    anel?: 'dentro' | 'fora'
}

interface Props {
    centro: { label: string; img?: string | null }
    nos: NoMapa[]
    accent: string
    ariaLabel: string
}

/** Anel de dentro em ângulos iguais; cada nó de fora cai no vão entre dois de dentro, para não colidir. */
function posicionar(nos: NoMapa[]) {
    const fora = (n: NoMapa) => (n.anel ?? (n.tipo === 'obra' ? 'fora' : 'dentro')) === 'fora'
    const interno = nos.filter(n => !fora(n))
    const externo = nos.filter(fora)
    const passo = 360 / Math.max(interno.length, 1)
    const dentro = interno.map((n, i) => ({ n, raio: 26, graus: -90 + passo * i }))
    // Cada nó de fora fica no meio do vão entre dois de dentro, espalhados pelo anel.
    const fora2 = externo.map((n, i) => {
        const vao = Math.floor((i * interno.length) / Math.max(externo.length, 1))
        return { n, raio: 41, graus: -90 + passo * (vao + 0.5) }
    })
    return [...dentro, ...fora2]
}

/**
 * Mapa radial: a entidade no centro (artista, grupo ou produção), os vínculos mais próximos no anel
 * de dentro e os secundários no de fora. Só entram vínculos já confirmados no catálogo.
 * Posição por trigonometria (left/top em %), linhas em SVG e `cqw` para manter as proporções
 * em qualquer largura; o hover acende a linha do nó sem JavaScript.
 */
export function MapaConexoes({ centro, nos, accent, ariaLabel }: Props) {
    const pathname = usePathname()
    const itens = posicionar(nos).map(it => {
        const rad = (it.graus * Math.PI) / 180
        // Arredonda: Math.cos/sin diferem na última casa entre Node e navegador, e isso quebra a hidratação.
        return { ...it, x: Math.round((50 + it.raio * Math.cos(rad)) * 100) / 100, y: Math.round((50 + it.raio * Math.sin(rad)) * 100) / 100 }
    })
    return (
        <nav aria-label={ariaLabel} data-bloco="mapa-conexoes"
            className="relative mx-auto aspect-square w-full max-w-[720px] [container-type:inline-size]">
            {itens.map(({ n, x, y }, i) => (
                <div key={`${n.tipo}-${n.href}`} className="group/no pointer-events-none absolute inset-0"
                    style={{ ['--atraso' as string]: `${i * 90}ms` }}>
                    <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
                        <line x1="50" y1="50" x2={x} y2={y} pathLength={1} vectorEffect="non-scaling-stroke"
                            className="mapa-linha stroke-border transition-colors group-hover/no:stroke-[var(--cor-mapa)]"
                            strokeWidth="1" style={{ ['--cor-mapa' as string]: accent }} />
                    </svg>
                    <Link href={n.href}
                        onClick={() => trackRecirculacao({ bloco: 'mapa-conexoes', posicao: i + 1, destino: n.href, origem: pathname })}
                        className="mapa-no pointer-events-auto absolute block -translate-x-1/2 -translate-y-1/2 outline-offset-4"
                        style={{ left: `${x}%`, top: `${y}%` }}>
                        <span className={`relative flex items-center justify-center overflow-hidden border-2 bg-surface text-[3.4cqw] font-bold transition-transform duration-200 group-hover/no:scale-110 ${n.tipo === 'obra' ? 'h-[12cqw] w-[8.5cqw] rounded-md' : 'h-[10cqw] w-[10cqw] rounded-full'}`}
                            style={{ borderColor: n.tipo === 'grupo' ? accent : 'var(--color-border)' }}>
                            {n.img
                                ? <Image src={n.img} alt="" fill sizes="96px" className="object-cover object-top" />
                                : n.label.charAt(0)}
                        </span>
                        <span className="absolute left-1/2 top-full mt-1 line-clamp-2 w-[18cqw] -translate-x-1/2 text-center text-[2.5cqw] font-semibold leading-tight text-muted transition-colors group-hover/no:text-foreground sm:text-[1.9cqw]">
                            {n.label}
                        </span>
                    </Link>
                </div>
            ))}
            <div className="absolute left-1/2 top-1/2 flex w-[22cqw] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center">
                <span className="relative block h-[17cqw] w-[17cqw] overflow-hidden rounded-full border-[3px] bg-surface" style={{ borderColor: accent }}>
                    {centro.img && <Image src={centro.img} alt="" fill sizes="160px" className="object-cover object-top" />}
                </span>
                <span className="text-[3.2cqw] font-black leading-tight text-foreground sm:text-[2.4cqw]">{centro.label}</span>
            </div>
        </nav>
    )
}
