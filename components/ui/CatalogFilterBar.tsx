import Link from 'next/link'
import { SearchInput } from '@/components/ui/SearchInput'

export interface FilterPill {
    label: string
    href: string
    active: boolean
    variant?: 'default' | 'accent'
}

interface Props {
    groups: FilterPill[][]
    searchPlaceholder?: string
    searchCurrent?: string
}

const PILL_BASE = 'shrink-0 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] transition-colors'
const PILL_INACTIVE = 'text-muted hover:text-foreground'
const PILL_ACTIVE_DEFAULT = 'bg-foreground text-background'
const PILL_ACTIVE_ACCENT = 'bg-accent-a11y text-white'

export function CatalogFilterBar({ groups, searchPlaceholder, searchCurrent }: Props) {
    return (
        <div className="border-b border-border/40 bg-surface/40">
            <div className="page-wrap flex items-center gap-3">
                <div className="flex flex-1 items-center gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
                    {groups.map((group, gi) => (
                        <span key={gi} className="contents">
                            {gi > 0 && <span className="mx-1 text-border shrink-0">|</span>}
                            {group.map((pill, pi) => (
                                <Link
                                    key={pi}
                                    href={pill.href}
                                    className={`${PILL_BASE} ${
                                        pill.active
                                            ? pill.variant === 'accent' ? PILL_ACTIVE_ACCENT : PILL_ACTIVE_DEFAULT
                                            : PILL_INACTIVE
                                    }`}
                                >
                                    {pill.label}
                                </Link>
                            ))}
                        </span>
                    ))}
                </div>
                {searchPlaceholder && (
                    <div className="shrink-0 py-1.5">
                        <SearchInput placeholder={searchPlaceholder} current={searchCurrent} />
                    </div>
                )}
            </div>
        </div>
    )
}
