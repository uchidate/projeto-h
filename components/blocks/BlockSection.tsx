import type { ReactNode } from 'react'

type BlockSectionProps = {
    id?: string
    children: ReactNode
    layout?: 'page' | 'content' | 'bare'
    spacing?: 'compact' | 'default' | 'spine' | 'none'
    className?: string
}

const SPACING = {
    compact: 'py-(--profile-section-block-compact)',
    default: 'py-(--profile-section-block)',
    spine: 'py-(--profile-section-spine)',
    none: '',
} as const

export function BlockSection({ id, children, layout = 'content', spacing = 'none', className = '' }: BlockSectionProps) {
    const layoutClass = layout === 'page'
        ? 'page-wrap border-t border-border/40'
        : layout === 'content' ? 'scroll-mt-(--scroll-anchor-offset,106px)' : ''

    return <section id={id} className={`${layoutClass} ${SPACING[spacing]} ${className}`.trim()}>{children}</section>
}
