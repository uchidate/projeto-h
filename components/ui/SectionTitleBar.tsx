import React from 'react'
import Link from 'next/link'
import { BlockHeader } from '@/components/blocks/BlockHeader'

interface Props {
    title: React.ReactNode
    eyebrow?: React.ReactNode
    tag?: React.ReactNode
    tagColor?: string
    href?: string
    linkText?: string
    action?: React.ReactNode
    className?: string
}

export function SectionTitleBar({ title, eyebrow, tag, tagColor, href, linkText = 'ver todos →', action, className = '' }: Props) {
    const resolvedAction = action ?? (href && (
        <Link href={href} className="touch-target inline-flex shrink-0 items-center text-[10px] font-black uppercase tracking-widest text-muted transition-colors hover:text-accent">
            {linkText}
        </Link>
    ))
    return (
        <BlockHeader title={title} eyebrow={eyebrow} tag={tag} tagColor={tagColor} action={resolvedAction} brandDot className={className} />
    )
}
