import type { ReactNode } from 'react'

export type NumberedListItem = { key: string; content: ReactNode }

export function NumberedList({ items, className = '' }: { items: NumberedListItem[]; className?: string }) {
    if (items.length === 0) return null
    return (
        <ol className={`space-y-2 ${className}`}>
            {items.map((item, index) => (
                <li key={item.key} className="grid grid-cols-[30px_minmax(0,1fr)] gap-3 border border-border bg-surface p-5">
                    <span aria-hidden="true" className="pt-0.5 font-mono text-[10px] font-black text-foreground">{index + 1}</span>
                    <div className="text-[14px] leading-relaxed text-foreground/75 sm:text-[15px]">{item.content}</div>
                </li>
            ))}
        </ol>
    )
}
