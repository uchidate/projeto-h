import type { ReactNode, SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string
    labelIcon?: ReactNode
}

export const filterSelectClass = 'h-8 shrink-0 rounded-md border border-border bg-surface py-0 pl-2.5 pr-8 text-[12px] font-bold text-foreground shadow-none focus:border-foreground focus:outline-hidden'

export function FilterSelect({ label, labelIcon, children, className = '', ...props }: Props) {
    return (
        <label className="flex shrink-0 items-center gap-1.5">
            <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                {labelIcon}
                {label}
            </span>
            <select {...props} className={`${filterSelectClass} ${className}`}>
                {children}
            </select>
        </label>
    )
}
