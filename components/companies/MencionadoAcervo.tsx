import Image from 'next/image'
import Link from 'next/link'
import { User, Users, Clapperboard, UtensilsCrossed, Building2 } from 'lucide-react'
import type { MencaoAcervo } from '@/lib/wordpress/mentions'

const ICON = { artist: User, group: Users, production: Clapperboard, food: UtensilsCrossed, company: Building2 }
const LABEL = { artist: 'Artista', group: 'Grupo', production: 'Produção', food: 'Comida', company: 'Empresa' }

interface Props {
    mentions: MencaoAcervo[]
    title?: string
}

/** Chips compactos pros artistas/grupos/produções que o acervo já associa à empresa. */
export function MencionadoAcervo({ mentions, title = 'Mencionado no acervo' }: Props) {
    if (mentions.length === 0) return null
    return (
        <div>
            <h2 className="mb-3 text-[18px] font-black tracking-tight">{title}</h2>
            <div className="flex flex-wrap gap-2">
                {mentions.map(m => {
                    const Icon = ICON[m.type]
                    return (
                        <Link key={`${m.type}-${m.href}`} href={m.href}
                            className="group flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-3 hover:border-accent transition-colors">
                            <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-surface-editorial/40 flex items-center justify-center">
                                {m.image ? (
                                    <Image src={m.image} alt="" fill className="object-cover" sizes="28px" />
                                ) : (
                                    <Icon size={13} className="text-muted" />
                                )}
                            </span>
                            <span className="text-[12px] leading-tight">
                                <span className="block font-mono text-[9px] uppercase tracking-wide text-muted">{LABEL[m.type]}</span>
                                <span className="font-bold group-hover:text-accent transition-colors">{m.title}</span>
                            </span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
