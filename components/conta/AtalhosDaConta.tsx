import type { ReactNode } from 'react'
import Link from '@/components/i18n/LocalizedLink'
import type { LucideIcon } from 'lucide-react'

/** Indicador clicável do topo do perfil (ícone + número + rótulo). */
export function IndicadorDaConta({ href, icone: Icone, classeIcone = 'text-accent', valor, rotulo }: {
    href: string
    icone?: LucideIcon
    classeIcone?: string
    valor: ReactNode
    rotulo: string
}) {
    return (
        <Link href={href} className="flex items-center gap-3 border border-border bg-surface p-4 hover:border-accent/50 transition-colors">
            {Icone ? <Icone size={18} className={`${classeIcone} shrink-0`} /> : <span className="text-[22px] font-black leading-none text-foreground">↗</span>}
            <span>
                <span className={`block font-black ${Icone ? 'text-[24px] leading-none' : 'text-[14px]'}`}>{valor}</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted">{rotulo}</span>
            </span>
        </Link>
    )
}

/** Cartão de atalho com ícone, título e descrição. */
export function CartaoDeAtalho({ href, icone: Icone, titulo, descricao }: { href: string; icone: LucideIcon; titulo: string; descricao: string }) {
    return (
        <Link href={href} className="group flex items-center gap-3 border border-border bg-surface p-4 transition-colors hover:border-accent/50">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent/10 text-accent">
                <Icone size={18} />
            </span>
            <span>
                <span className="block text-[14px] font-black group-hover:text-accent">{titulo}</span>
                <span className="text-[12px] text-muted">{descricao}</span>
            </span>
        </Link>
    )
}
