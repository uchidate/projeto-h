import type { ReactNode } from 'react'

export type InfoCardItem = {
    key: string
    title: ReactNode
    body: ReactNode
    meta?: ReactNode
}

export function InfoCardGrid({ items, columns = 2, className = '' }: { items: InfoCardItem[]; columns?: 2 | 3; className?: string }) {
    if (items.length === 0) return null
    return (
        <div className={`grid gap-3 ${columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'} ${className}`}>
            {items.map(item => (
                <article key={item.key} className="border border-border bg-surface p-5">
                    {item.meta && <div className="mb-2 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-muted">{item.meta}</div>}
                    <h3 className="text-[14px] font-black leading-snug text-foreground">{item.title}</h3>
                    <div className="mt-2 text-[13px] leading-6 text-muted">{item.body}</div>
                </article>
            ))}
        </div>
    )
}
