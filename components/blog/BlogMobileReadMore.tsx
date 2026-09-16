'use client'

import { useState } from 'react'

interface Props {
    children: React.ReactNode
    /** Height in px of visible content before the gate on mobile (default 1300) */
    gateHeight?: number
}

export function BlogMobileReadMore({ children, gateHeight = 1300 }: Props) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div>
            <div
                className={`relative ${expanded ? '' : 'max-lg:max-h-(--mobile-gate-height) max-lg:overflow-hidden'}`}
                style={{ '--mobile-gate-height': `${gateHeight}px` } as React.CSSProperties}
            >
                {children}

                {!expanded && (
                    <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-44 max-lg:block"
                        style={{ background: 'linear-gradient(to bottom, transparent, var(--color-background, #fff))' }}
                    />
                )}
            </div>

            {!expanded && (
                <div id="blog-saiba-mais-gate" className="flex flex-col items-center bg-background pb-8 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className="mt-2 w-[80%] border-2 border-foreground py-3 font-mono text-[11px] font-black uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground hover:text-background active:opacity-80"
                    >
                        Saiba mais
                    </button>
                </div>
            )}
        </div>
    )
}
