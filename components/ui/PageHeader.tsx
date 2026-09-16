import type { ReactNode } from 'react'

interface Props {
    eyebrow?: string
    title: string
    subtitle?: ReactNode
    meta?: ReactNode
    children?: ReactNode
    className?: string
}

export function PageHeader({ eyebrow, title, subtitle, meta, children, className = '' }: Props) {
    return (
        <header className={`page-wrap border-b border-border/50 bg-background py-3 lg:py-4 ${className}`}>
            <div className="flex min-w-0 items-end justify-between gap-4">
                <div className="min-w-0">
                    {eyebrow && (
                        <p className="mb-1 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-accent">
                            {eyebrow}
                        </p>
                    )}
                    <h1 className="truncate text-lg font-black tracking-[-0.03em] text-foreground sm:text-2xl">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="truncate text-[12px] font-semibold text-muted sm:text-[13px]">
                            {subtitle}
                        </p>
                    )}
                </div>
                {(meta || children) && (
                    <div className="shrink-0 flex items-center gap-3">
                        {children}
                        {meta && (
                            <div className="hidden text-right font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted lg:block">
                                {meta}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    )
}
