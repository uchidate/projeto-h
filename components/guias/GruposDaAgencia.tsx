import Image from 'next/image'
import Link from 'next/link'
import type { WPGroup } from '@/lib/wordpress/types'

const TIPO: Record<string, string> = { girl_group: 'Girl group', boy_group: 'Boy group', co_ed: 'Misto', solo: 'Solo' }
const MONO = 'font-mono text-[10px] font-bold uppercase tracking-[0.14em]'

/** Faixa de grupos de uma agência, antes da grade de artistas: quem procura "JYP" quer TWICE e Stray Kids antes de ver uma lista alfabética. */
export function GruposDaAgencia({ agencia, grupos }: { agencia: string; grupos: WPGroup[] }) {
    if (grupos.length === 0) return null
    return (
        <section aria-label={`Grupos da ${agencia}`} className="space-y-4">
            <div className="flex items-center gap-3">
                <span aria-hidden className="h-3 w-3 shrink-0 bg-accent" />
                <h2 className="whitespace-nowrap font-mono text-[11px] font-black uppercase tracking-[0.18em] text-foreground">{`Grupos · ${grupos.length}`}</h2>
                <span aria-hidden className="h-0.5 min-w-4 flex-1 bg-accent opacity-35" />
            </div>
            <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 xl:grid-cols-5">
                {grupos.map((g, i) => {
                    const estreia = g.acf?.debut_date?.slice(0, 4)
                    const membros = g.acf?.members?.length ?? 0
                    const encerrado = g.acf?.active === false || !!g.acf?.disbandment_date
                    const meta = [TIPO[g.acf?.type ?? ''], estreia ? `estreia ${estreia}` : '', membros ? `${membros} integrantes` : ''].filter(Boolean).join(' · ')
                    return (
                        <li key={g.id} className="w-[170px] shrink-0 lg:w-auto">
                            <Link href={`/groups/${g.slug}`} className="group block">
                                <div className="relative aspect-4/5 overflow-hidden bg-surface">
                                    {g.featured_image_url
                                        ? <Image src={g.featured_image_url} alt={g.title.rendered} fill priority={i < 4} sizes="(max-width: 1024px) 170px, 20vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                                        : <div className="flex h-full items-center justify-center text-3xl font-black text-muted/20">{g.title.rendered[0]}</div>}
                                    {encerrado && <span className={`absolute left-2 top-2 bg-background/90 px-1.5 py-0.5 text-[9px] text-muted ${MONO}`}>Encerrado</span>}
                                </div>
                                <div className="border-b border-border/50 py-2">
                                    <h3 className="truncate text-[14px] font-bold text-foreground transition-colors group-hover:text-accent">{g.title.rendered}</h3>
                                    {meta && <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">{meta}</p>}
                                </div>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
