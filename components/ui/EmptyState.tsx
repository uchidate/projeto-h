import type { ReactNode } from 'react'
import Link from 'next/link'

interface Props {
    icon?: ReactNode
    title?: ReactNode
    description: ReactNode
    actionHref?: string
    actionLabel?: string
    bordered?: boolean
    layout?: 'centered' | 'compact'
    className?: string
}

export function EmptyState({ icon, title, description, actionHref, actionLabel, bordered = false, layout = 'centered', className = '' }: Props) {
    const layoutClass = layout === 'compact' ? 'items-start p-8 text-left' : 'items-center py-20 text-center'
    return (
        <div className={`flex flex-col ${layoutClass} ${bordered ? 'border border-dashed border-border' : ''} ${className}`}>
            {icon && <div className="mb-4 text-muted/20">{icon}</div>}
            {title && <p className="mb-1 text-[16px] font-bold text-foreground">{title}</p>}
            <p className={layout === 'compact' ? 'text-sm text-muted' : 'text-[13px] text-muted'}>{description}</p>
            {actionHref && actionLabel && (
                <Link href={actionHref} className="mt-4 text-[13px] font-semibold text-accent hover:underline">
                    {actionLabel}
                </Link>
            )}
        </div>
    )
}
