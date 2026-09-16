import Link from 'next/link'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'
import type { HomeSettings } from '@/lib/wordpress/site-settings'

export function HomeEditorialHubs({ hubs }: { hubs: HomeSettings['hubs'] }) {
    return (
        <div className="border-t border-border px-4 py-5 sm:px-6 lg:px-5">
            <SectionTitleBar title="Explorar por categoria" href="/blog" linkText="ver todas →" className="mb-3" />
            <div className="lg:hidden -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6" style={{ scrollbarWidth: 'none' }}>
                {hubs.map(h => (
                    <Link key={`${h.label}-${h.href}`} href={h.href}
                        className="group relative shrink-0 flex flex-col justify-between overflow-hidden px-3 py-2.5 min-w-[100px] h-[68px] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                        style={{ border: `2px solid ${h.color}`, background: `linear-gradient(135deg, ${h.color}18 0%, ${h.color}06 100%)` }}>
                        {h.hangul && (
                            <span className="pointer-events-none absolute -bottom-1 right-1 text-[44px] font-black leading-none select-none"
                                style={{ color: `${h.color}18` }}>
                                {h.hangul}
                            </span>
                        )}
                        <span className="relative text-[13px] font-black leading-tight tracking-[-0.03em] text-foreground whitespace-nowrap">{h.label}</span>
                        <span className="relative text-[9px] font-bold uppercase tracking-[0.08em] text-muted/70 whitespace-nowrap">{h.detail}</span>
                    </Link>
                ))}
            </div>
            <div className="hidden lg:grid grid-cols-6 gap-2.5">
                {hubs.map(h => (
                    <Link key={`${h.label}-${h.href}`} href={h.href}
                        className="group relative h-[112px] overflow-hidden p-2.5 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                        style={{ border: `2px solid ${h.color}`, background: `linear-gradient(135deg, ${h.color}1a 0%, ${h.color}06 100%)` }}>
                        <span className="pointer-events-none absolute -bottom-2 right-2 text-[68px] font-black leading-none -tracking-widest"
                            style={{ color: `${h.color}16` }}>
                            {h.hangul}
                        </span>
                        <div className="relative flex h-full flex-col justify-between">
                            <div>
                                <h3 className="text-[17px] font-black leading-none tracking-[-0.04em] text-foreground">{h.label}</h3>
                                <p className="mt-1 text-[10px] font-black uppercase leading-none tracking-[0.12em] text-foreground/85">{h.detail}</p>
                            </div>
                            <div className="flex items-center justify-end">
                                <span className="text-[18px] font-black leading-none transition-transform group-hover:translate-x-1" style={{ color: h.color }}>→</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
