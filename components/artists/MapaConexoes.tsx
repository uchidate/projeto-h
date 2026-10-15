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
}

interface Props {
    centro: { label: string; img?: string | null }
    nos: NoMapa[]
    accent: string
    ariaLabel: string
}

/** Cada anel posiciona seus nós em ângulos iguais; o segundo anel gira meia fatia para não alinhar com o primeiro. */
function posicionar(nos: NoMapa[]) {
    const interno = nos.filter(n => n.tipo !== 'obra')
    const externo = nos.filter(n => n.tipo === 'obra')
    const passoInterno = 360 / Math.max(interno.length, 1)
    // O anel de fora começa meia fatia depois, para cada obra ficar entre dois nós de dentro.
    const colocar = (lista: NoMapa[], raio: number, fase: number) =>
        lista.map((n, i) => ({ n, raio, graus: fase + (360 / lista.length) * i }))
    return [...colocar(interno, 26, -90), ...colocar(externo, 40, -90 + passoInterno / 2)]
}

/**
 * Mapa radial: o artista no centro, o grupo e os colegas no anel de dentro, as obras no de fora.
 * Só entram vínculos já confirmados no catálogo (integrantes do grupo e elenco de produções).
 * Tudo em CSS: cada nó vive num eixo girado (a linha é a própria régua do eixo), e o hover
 * acende a linha do nó sem JavaScript. `cqw` mantém as proporções em qualquer largura.
 */
export function MapaConexoes({ centro, nos, accent, ariaLabel }: Props) {
    const pathname = usePathname()
    const itens = posicionar(nos).map(it => {
        const rad = (it.graus * Math.PI) / 180
        return { ...it, x: 50 + it.raio * Math.cos(rad), y: 50 + it.raio * Math.sin(rad) }
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
