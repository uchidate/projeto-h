import type { ReactNode } from 'react'

export type FactItem = { label: ReactNode; value: ReactNode; description?: ReactNode }

export function FactGrid({
    items,
    columns = 2,
    className = '',
    variant = 'cards',
}: {
    items: FactItem[]
    columns?: 1 | 2 | 3 | 4
    className?: string
    variant?: 'cards' | 'list'
}) {
    if (items.length === 0) return null
    const grid = columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : columns === 3 ? 'sm:grid-cols-3' : columns === 2 ? 'sm:grid-cols-2' : ''
    const isList = variant === 'list'
    return (
        <dl className={`grid ${isList ? 'gap-0' : 'gap-2.5'} ${grid} ${className}`}>
            {items.map((item, index) => (
                <div key={index} className={isList ? 'border-b border-border/70 py-3.5 last:border-b-0' : 'profile-fact-card'}>
                    <dt className="profile-kicker">{item.label}</dt>
                    <dd className="mt-1.5 text-[0.95rem] font-black leading-snug tracking-[-0.01em] text-foreground sm:text-base">{item.value}</dd>
                    {item.description && <p className="mt-1 text-[12px] leading-5 text-muted">{item.description}</p>}
                </div>
            ))}
        </dl>
    )
}
