'use client'
/* eslint-disable react-hooks/set-state-in-effect -- list contents hydrate from localStorage */

import { useState, useEffect, useCallback } from 'react'

export function useLocalList(key: string) {
    const [ids, setIds] = useState<number[]>([])
    const [ready, setReady] = useState(false)

    useEffect(() => {
        try {
            const raw = localStorage.getItem(key)
            setIds(raw ? JSON.parse(raw) : [])
        } catch { setIds([]) }
        setReady(true)
    }, [key])

    const toggle = useCallback((id: number) => {
        setIds(prev => {
            const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
            return next
        })
    }, [key])

    const has = useCallback((id: number) => ids.includes(id), [ids])

    return { ids, has, toggle, ready }
}
