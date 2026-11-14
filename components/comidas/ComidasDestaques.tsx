import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import { FOOD_CATEGORY_EMOJI } from '@/lib/wordpress/foods'
import type { WPFood } from '@/lib/wordpress/types'
import { pratosEmDestaque } from '@/lib/comidas/pratosEmDestaque'

type Rotulos = {
    kicker: string
    titulo: string
    didYouKnow: string
    seeDish: string
}

/**
 * Vitrine dos pratos mais famosos, logo abaixo do cabeçalho: um prato grande e seis menores,
 * cada um com uma curiosidade da própria ficha como gancho. A ordem vem do `trending_score`.
 */
export function ComidasDestaques({ pratos, rotulos, rotuloCategoria }: { pratos: WPFood[]; rotulos: Rotulos; rotuloCategoria: (c: string) => string }) {
    const destaques = pratosEmDestaque(pratos, 7)
    if (destaques.length < 4) return null
    const [principal, ...demais] = destaques

    return (
        <section data-bloco="comidas-destaques" aria-labelledby="comidas-destaques-titulo" className="border-b border-border/40">
            <div className="page-wrap py-8 sm:py-10">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">{rotulos.kicker}</p>
                <h2 id="comidas-destaques-titulo" className="mb-5 mt-1 font-serif text-[24px] font-semibold leading-tight sm:text-[30px]">{rotulos.titulo}</h2>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    <CartaoPrincipal prato={principal} rotulos={rotulos} rotuloCategoria={rotuloCategoria} />
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {demais.map(p => (
                            <li key={p.slug}>
                                <Link href={`/comidas/${p.slug}`} className="group flex h-full flex-col overflow-hidden border border-border bg-background transition-colors hover:border-accent">
                                    <span className="relative block aspect-[4/3] overflow-hidden bg-surface">
                                        <Image src={p.imagem} alt={p.nome} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 14vw"
                                            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                                    </span>
                                    <span className="flex flex-1 flex-col p-2.5">
                                        <span className="block text-[14px] font-bold leading-tight text-foreground group-hover:text-accent">{p.nome}</span>
                                        {p.coreano && <span className="mt-0.5 block text-[11px] text-muted">{p.coreano}</span>}
                                        {p.gancho && <span className="mt-1.5 line-clamp-3 text-[12px] leading-snug text-foreground/70">{p.gancho}</span>}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    )
}

function CartaoPrincipal({ prato, rotulos, rotuloCategoria }: { prato: ReturnType<typeof pratosEmDestaque>[number]; rotulos: Rotulos; rotuloCategoria: (c: string) => string }) {
    return (
        <Link href={`/comidas/${prato.slug}`} className="group relative flex min-h-[320px] flex-col justify-end overflow-hidden border border-border bg-foreground sm:min-h-[380px]">
            <Image src={prato.imagem} alt={prato.nome} fill priority sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
            <span className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent" aria-hidden="true" />
            <span className="relative flex flex-col gap-1.5 p-5 text-white">
                {prato.categoria && (
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">
                        {FOOD_CATEGORY_EMOJI[prato.categoria] ?? '🍽️'} {rotuloCategoria(prato.categoria)}
                    </span>
                )}
                <span className="text-[26px] font-black leading-none tracking-[-0.02em] sm:text-[32px]">{prato.nome}</span>
                {prato.coreano && <span className="text-[13px] text-white/80">{prato.coreano}</span>}
                {prato.gancho && (
                    <span className="mt-1 line-clamp-4 text-[14px] leading-snug text-white/90">
                        <strong className="font-mono text-[10px] uppercase tracking-[0.1em] text-white">{rotulos.didYouKnow} </strong>
                        {prato.gancho}
                    </span>
                )}
                <span className="mt-2 inline-flex w-fit items-center bg-accent-a11y px-3 py-1.5 font-mono text-[11px] font-black uppercase tracking-wide text-white">{rotulos.seeDish} →</span>
            </span>
        </Link>
    )
}

