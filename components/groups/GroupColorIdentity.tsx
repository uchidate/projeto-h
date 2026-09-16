'use client'

import { useState } from 'react'
import { toRgba } from '@/lib/theme/color'

function hexToRgb(hex: string): string {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `${r}, ${g}, ${b}`
}

function hexToHsl(hex: string): string {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16) / 255
    const g = parseInt(h.slice(2, 4), 16) / 255
    const b = parseInt(h.slice(4, 6), 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let hue = 0, sat = 0
    const lum = (max + min) / 2
    if (max !== min) {
        const d = max - min
        sat = lum > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case r: hue = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
            case g: hue = ((b - r) / d + 2) / 6; break
            case b: hue = ((r - g) / d + 4) / 6; break
        }
    }
    return `${Math.round(hue * 360)}, ${Math.round(sat * 100)}%, ${Math.round(lum * 100)}%`
}

interface Props {
    officialColor: string
    groupName: string
    fanClubName?: string | null
    lightstick?: string | null
}

export function GroupColorIdentity({ officialColor, groupName, fanClubName, lightstick }: Props) {
    const [copied, setCopied] = useState(false)

    const copy = () => {
        navigator.clipboard.writeText(officialColor).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        })
    }

    const rgb = hexToRgb(officialColor)
    const hsl = hexToHsl(officialColor)

    return (
        <div className="border border-border bg-background overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-border">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">
                    Identidade Visual · {groupName}
                </p>
            </div>

            {/* Hero color band */}
            <button
                type="button"
                onClick={copy}
                title="Clique para copiar o hex"
                className="relative w-full h-28 sm:h-36 flex items-end p-4 transition-opacity hover:opacity-90 active:opacity-75 focus:outline-hidden"
                style={{ background: `linear-gradient(135deg, ${toRgba(officialColor, 0.7)} 0%, ${officialColor} 60%, #000 160%)` }}
            >
                <div className="flex items-baseline gap-3">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-white drop-shadow-sm">
                        {copied ? '✓ copiado!' : officialColor.toUpperCase()}
                    </span>
                    {!copied && (
                        <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white/60">
                            toque para copiar
                        </span>
                    )}
                </div>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-white/20"
                    style={{ background: toRgba('#ffffff', 0.12) }} />
            </button>

            {/* Color values */}
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
                {[
                    { label: 'HEX', value: officialColor.toUpperCase() },
                    { label: 'RGB', value: rgb },
                    { label: 'HSL', value: hsl },
                ].map(({ label, value }) => (
                    <div key={label} className="px-3 py-2.5">
                        <p className="font-mono text-[9px] font-black uppercase tracking-widest text-muted mb-0.5">{label}</p>
                        <p className="font-mono text-[11px] font-bold text-foreground truncate">{value}</p>
                    </div>
                ))}
            </div>

            {(fanClubName || lightstick) && (
                <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-border">
                    {fanClubName && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 border font-mono text-[10px] font-black uppercase tracking-wider"
                            style={{ borderColor: toRgba(officialColor, 0.5), color: officialColor, background: toRgba(officialColor, 0.06) }}>
                            ♡ {fanClubName}
                        </span>
                    )}
                    {lightstick && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-border font-mono text-[10px] font-black uppercase tracking-wider text-muted">
                            ✦ {lightstick}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
