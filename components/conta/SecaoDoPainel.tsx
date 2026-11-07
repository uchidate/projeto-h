import type { ReactNode } from 'react'
import Link from '@/components/i18n/LocalizedLink'

const LINK_CLASSE = 'font-mono text-[11px] text-accent hover:underline uppercase tracking-[0.06em]'

/** Link pequeno de canto de seção ("Ver todos →"). */
export function LinkDeSecao({ href, children }: { href: string; children: ReactNode }) {
    return <Link href={href} className={LINK_CLASSE}>{children}</Link>
}

/** Seção do painel da conta: sobretítulo, título e, à direita, um link ou ações. */
export function SecaoDoPainel({ eyebrow, title, id, acao, children }: {
    eyebrow: string
    title: string
    id?: string
    acao?: ReactNode
    children: ReactNode
}) {
    return (
        <section id={id}>
            <div className="mb-5 flex items-baseline justify-between">
                <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">{eyebrow}</p>
                    <h2 className="text-[20px] font-black tracking-tight">{title}</h2>
                </div>
                {acao}
            </div>
            {children}
        </section>
    )
}
