'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { queryAtual } from '@/lib/listagem/query-atual'

export interface FilterOption {
    value: string
    label: string
}

interface FilterGroupProps {
    label: string
    param: string
    options: FilterOption[]
    current?: string
}

export function FilterBar({ groups }: { groups: FilterGroupProps[] }) {
    const router = useRouter()
    const pathname = usePathname()

    const setParam = useCallback((param: string, value: string) => {
        const params = queryAtual()
        if (value) {
            params.set(param, value)
        } else {
            params.delete(param)
        }
        params.delete('page') // reset página ao filtrar
        router.push(`${pathname}?${params.toString()}`)
    }, [pathname, router])

    return (
        <div className="flex flex-wrap gap-3 mb-8">
            {groups.map(group => (
                <div key={group.param} className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted mr-1">
                        {group.label}
                    </span>
                    {group.options.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setParam(group.param, opt.value)}
                            className={`px-3 py-1 text-[12px] font-semibold transition-colors ${
                                (group.current ?? '') === opt.value
                                    ? 'bg-foreground text-background'
                                    : 'border border-border text-muted hover:border-foreground hover:text-foreground'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    )
}
