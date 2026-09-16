'use client'
import { intlLocale } from '@/lib/i18n/format'
/* eslint-disable react-hooks/set-state-in-effect -- count-up animation resets when its target changes */

import { useEffect, useRef, useState } from 'react'
import { toRgba } from '@/lib/theme/color'

interface Stat {
    label: string
    value: string
    description?: string
}

function useCountUp(target: number, shouldStart: boolean) {
    const [current, setCurrent] = useState(0)
    useEffect(() => {
        if (!shouldStart || target === 0) { setCurrent(target); return }
        const duration = 1400
        const start = performance.now()
        const raf = (now: number) => {
            const t = Math.min((now - start) / duration, 1)
            const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
            setCurrent(Math.round(eased * target))
            if (t < 1) requestAnimationFrame(raf)
        }
        requestAnimationFrame(raf)
    }, [target, shouldStart])
    return current
}

function parseStatValue(value: string) {
    const numMatch = value.match(/^([\d,.]+)(.*)$/)
    const numericStr = numMatch ? numMatch[1].replace(/,/g, '.') : ''
    const numericVal = parseFloat(numericStr)
    const suffix = numMatch ? numMatch[2].trim() : ''
    const isAnimatable = !isNaN(numericVal) && numericVal > 0 && numericVal < 10000 && suffix === ''
    return { numericVal, suffix, isAnimatable }
}

function useVisible() {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setVisible(true); obs.disconnect() }
        }, { threshold: 0.2 })
        obs.observe(el)
        return () => obs.disconnect()
    }, [])
    return { ref, visible }
}

function StatCard({ stat, accent, size }: { stat: Stat; accent: string; size: 'hero' | 'normal' }) {
    const { ref, visible } = useVisible()
    const { numericVal, isAnimatable } = parseStatValue(stat.value)
    const animated = useCountUp(isAnimatable ? numericVal : 0, visible && isAnimatable)
    const displayValue = isAnimatable && visible ? animated.toLocaleString(intlLocale()) : stat.value

    if (size === 'hero') {
        return (
            <div ref={ref}
                className="relative overflow-hidden border p-6 flex flex-col justify-between gap-4 min-h-[140px]"
                style={{ borderColor: toRgba(accent, 0.5), background: toRgba(accent, 0.08) }}>
                {/* Watermark */}
                <span className="pointer-events-none absolute -right-4 -bottom-4 font-black leading-none select-none"
                    style={{ fontSize: 'clamp(80px, 18vw, 128px)', color: toRgba(accent, 0.08) }}>
                    {stat.value.replace(/[^0-9.,BMKk%+]/g, '') || stat.value[0]}
                </span>

                <div className="relative z-10">
                    <p className="mb-3 font-mono text-[10px] font-black uppercase leading-4 tracking-[0.12em]"
                        style={{ color: toRgba(accent, 0.8) }}>
                        {stat.label}
                    </p>
                    <p className="font-display text-5xl sm:text-6xl font-black leading-none tabular-nums"
                        style={{ color: accent }}>
                        {displayValue}
                    </p>
                </div>

                {stat.description && (
                    <p className="relative z-10 max-w-prose text-[13px] leading-5 text-muted">
                        {stat.description}
                    </p>
                )}
            </div>
        )
    }

    return (
        <div ref={ref} className="border border-border bg-background p-4 flex flex-col gap-2">
            <p className="font-mono text-[10px] font-black uppercase leading-4 tracking-widest text-muted">
                {stat.label}
            </p>
            <p className="font-display text-3xl font-black leading-none tabular-nums"
                style={{ color: accent }}>
                {displayValue}
            </p>
            {stat.description && (
                <p className="mt-auto line-clamp-3 pt-1 text-[13px] leading-5 text-muted">
                    {stat.description}
                </p>
            )}
        </div>
    )
}

interface Props {
    stats: Stat[]
    accent: string
}

export function GroupStatsNumbers({ stats, accent }: Props) {
    if (stats.length === 0) return null

    const [hero, ...rest] = stats

    return (
        <div className="flex flex-col gap-3">
            <StatCard stat={hero} accent={accent} size="hero" />
            {rest.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {rest.map((stat, i) => (
                        <StatCard key={i} stat={stat} accent={accent} size="normal" />
                    ))}
                </div>
            )}
        </div>
    )
}
