'use client'

import { useTranslations } from 'next-intl'
/* eslint-disable react-hooks/set-state-in-effect -- client-side date calculation avoids timezone hydration drift */

import { useEffect, useState } from 'react'
import { Cake } from 'lucide-react'

// Converte YYYYMMDD ou YYYY-MM-DD para Date local
function parseDate(s: string): Date | null {
    const normalized = /^\d{8}$/.test(s)
        ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
        : s
    const m = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!m) return null
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

interface Props {
    debutDate: string  // YYYYMMDD ou YYYY-MM-DD
    groupName: string
}

function getDaysToNextAnniversary(debutDate: string): { days: number; years: number } | null {
    try {
        const debut = parseDate(debutDate)
        if (!debut || isNaN(debut.getTime())) return null
        const now = new Date()
        const thisYear = now.getFullYear()

        let next = new Date(thisYear, debut.getMonth(), debut.getDate())
        // Se já passou este ano, calcular para o próximo
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        if (next < todayStart) next = new Date(thisYear + 1, debut.getMonth(), debut.getDate())

        const diffMs = next.getTime() - todayStart.getTime()
        const days = Math.round(diffMs / (1000 * 60 * 60 * 24))
        const nextYears = next.getFullYear() - debut.getFullYear()
        if (nextYears <= 0) return null
        return { days, years: nextYears }
    } catch { return null }
}

export function AnniversaryCountdown({ debutDate, groupName: _groupName }: Props) {
    const tc = useTranslations('client')
    const [data, setData] = useState<{ days: number; years: number } | null>(null)

    useEffect(() => {
        setData(getDaysToNextAnniversary(debutDate))
    }, [debutDate])

    if (!data) return null
    if (data.days > 180) return null  // não mostrar se faltar mais de 6 meses

    const isToday = data.days === 0

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] font-bold border ${
            isToday
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-muted'
        }`}>
            <Cake size={12} />
            {isToday
                ? tc('anniversary.today', { years: data.years })
                : tc('anniversary.inDays', { years: data.years, days: data.days })
            }
        </div>
    )
}
