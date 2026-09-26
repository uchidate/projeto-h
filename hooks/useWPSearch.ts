'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { SearchResult } from '@/lib/search/types'

async function searchWP(query: string, signal: AbortSignal): Promise<SearchResult[]> {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal,
        headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`busca ${res.status}`)
    const data = await res.json() as { results?: SearchResult[] }
    return data.results ?? []
}

export type { SearchResult } from '@/lib/search/types'

export function useWPSearch(query: string) {
    const [results, setResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    // Falha da API != "nenhum resultado": quem mede a busca precisa distinguir os dois.
    const [erro, setErro] = useState(false)
    const abortRef = useRef<AbortController | null>(null)
    const requestRef = useRef(0)

    const search = useCallback(async (q: string) => {
        abortRef.current?.abort()
        if (q.trim().length < 2) { setResults([]); setErro(false); setIsLoading(false); return }

        const requestId = ++requestRef.current
        abortRef.current = new AbortController()
        setIsLoading(true)
        setErro(false)

        try {
            const data = await searchWP(q.trim(), abortRef.current.signal)
            if (requestId === requestRef.current) setResults(data)
        } catch (e) {
            if ((e as Error).name !== 'AbortError' && requestId === requestRef.current) { setResults([]); setErro(true) }
        } finally {
            if (requestId === requestRef.current) setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        const t = setTimeout(() => search(query), 180)
        return () => {
            clearTimeout(t)
            abortRef.current?.abort()
        }
    }, [query, search])

    return { results, isLoading, erro }
}
