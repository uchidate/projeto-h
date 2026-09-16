'use client'

import { intlLocale } from '@/lib/i18n/format'
import { useEffect, useRef, useState } from 'react'

interface Stat {
    label: string
    value: string
}

function useCountUp(target: number, duration = 1000, shouldStart: boolean) {
    const [current, setCurrent] = useState(0)
    useEffect(() => {
        if (!shouldStart || target === 0) return
        const start = performance.now()
        const raf = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
            setCurrent(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(raf)
        }
        requestAnimationFrame(raf)
    }, [target, duration, shouldStart])
    return current
}

function AnimatedStat({ value, label, accent }: { value: string; label: string; accent: string }) {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
        }, { threshold: 0.3 })
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    const match = value.match(/^([\d,]+)(.*)$/)
    const numericPart = match ? parseInt(match[1].replace(/,/g, '')) : 0
    const suffix = match ? match[2] : ''
    const isYear = numericPart >= 1900 && numericPart <= 2100 && suffix === ''
    const isAnimatable = numericPart > 0 && numericPart < 100000 && !isYear

    const animated = useCountUp(numericPart, 1000, visible && isAnimatable)
    const displayValue = isAnimatable && visible
        ? animated.toLocaleString(intlLocale()) + suffix
        : value

    return (
        <div ref={ref} className="px-4 py-5 sm:px-6">
            <p className="font-display text-2xl font-black leading-none sm:text-3xl tabular-nums"
                style={{ color: accent }}>
                {displayValue}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted">{label}</p>
        </div>
    )
}

export function GroupAnimatedStats({ stats, accent }: { stats: Stat[]; accent: string }) {
    if (stats.length === 0) return null
    return (
        <div className="border-y border-foreground/10 divide-x divide-foreground/10">
            <div className="page-wrap">
                <div className={`grid divide-x divide-foreground/10 grid-cols-${Math.min(stats.length, 4)} sm:grid-cols-${Math.min(stats.length, 4)}`}>
                    {stats.slice(0, 4).map(stat => (
                        <AnimatedStat key={stat.label} value={stat.value} label={stat.label} accent={accent} />
                    ))}
                </div>
            </div>
        </div>
    )
}
