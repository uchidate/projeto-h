import type { ReactNode } from 'react'

interface Props {
    children: ReactNode
    density?: 'compact' | 'default' | 'wide'
    className?: string
}

const gapClass = {
    compact: 'gap-1',
    default: 'gap-2',
    wide: 'gap-3',
}

export function EntityActionBar({ children, density = 'default', className = '' }: Props) {
    return <div className={`flex flex-wrap items-center ${gapClass[density]} ${className}`}>{children}</div>
}
