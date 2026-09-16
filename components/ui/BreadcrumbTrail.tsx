import type { ReactNode } from 'react'
import Link from 'next/link'

export interface BreadcrumbItem {
    label: string
    href?: string
}

interface Props {
    items: BreadcrumbItem[]
    separator?: ReactNode
    className?: string
    itemClassName?: string
    linkClassName?: string
    currentClassName?: string
    separatorClassName?: string
}

export function BreadcrumbTrail({
    items,
    separator = '/',
    className = '',
    itemClassName = '',
    linkClassName = '',
    currentClassName = '',
    separatorClassName = '',
}: Props) {
    return (
        <ol className={className}>
            {items.map((item, index) => {
                const current = index === items.length - 1
                return (
                    <li key={`${item.href ?? item.label}-${index}`} className={itemClassName}>
                        {index > 0 && <span className={separatorClassName} aria-hidden="true">{separator}</span>}
                        {item.href && !current ? (
                            <Link href={item.href} className={linkClassName}>{item.label}</Link>
                        ) : (
                            <span className={currentClassName}>{item.label}</span>
                        )}
                    </li>
                )
            })}
        </ol>
    )
}
