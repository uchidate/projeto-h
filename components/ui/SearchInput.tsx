'use client'
/* eslint-disable react-hooks/set-state-in-effect -- controlled input follows external URL state */

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
    placeholder?: string
    param?: string
    current?: string
    className?: string
}

export function SearchInput({ placeholder = 'Buscar...', param = 'search', current = '', className = '' }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [value, setValue] = useState(current)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => setValue(current), [current])
    useEffect(() => () => {
        if (timerRef.current) clearTimeout(timerRef.current)
    }, [])

    const push = useCallback((q: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (q) { params.set(param, q) } else { params.delete(param) }
        params.delete('page')
        const qs = params.toString()
        router.push(`${pathname}${qs ? `?${qs}` : ''}`)
    }, [pathname, param, router, searchParams])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value
        setValue(q)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => push(q), 400)
    }

    const clear = () => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setValue('')
        push('')
    }

    return (
        <div className={`flex h-9 w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 transition-colors focus-within:border-foreground lg:h-8 lg:w-[280px] lg:shrink-0 ${className}`}>
            <Search className="h-4 w-4 shrink-0 text-muted pointer-events-none" />
            <input
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                className="min-w-0 flex-1 appearance-none input-embutido border-0 bg-transparent p-0 text-[13px] text-foreground outline-hidden placeholder:text-muted focus:outline-hidden focus:ring-0 focus-visible:outline-hidden"
            />
            {value && (
                <button
                    type="button"
                    onClick={clear}
                    className="flex h-6 shrink-0 items-center justify-center rounded-md bg-surface px-1.5 text-muted hover:text-foreground"
                    aria-label="Limpar busca"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    )
}
