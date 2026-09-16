import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'

interface Props {
    color: string | null
    lightstick: string | null
    groupCount: number
    artistCount: number
    accent: string
}

export function FandomSidebarFicha({ color, lightstick, groupCount, artistCount, accent }: Props) {
    return (
        <aside
            aria-label="Informações da fandom"
            className="hidden xl:flex flex-col gap-6 w-[260px] shrink-0 sticky top-[calc(var(--site-header-h)+var(--reading-bar-h,42px)+16px)]"
        >
            <div className="rounded-none border border-border bg-surface p-5 space-y-4"
                style={{ borderTopColor: accent, borderTopWidth: 2 }}>
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Ficha da fandom</p>

                {color && (
                    <div>
                        <p className="font-mono text-[10px] text-muted uppercase tracking-wider font-bold">Cor oficial</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-4 h-4 rounded-full border border-border" style={{ background: color }} />
                            <p className="text-[13px] font-semibold text-foreground">{color}</p>
                        </div>
                    </div>
                )}

                {lightstick && (
                    <div>
                        <p className="font-mono text-[10px] text-muted uppercase tracking-wider font-bold">Lightstick</p>
                        <p className="text-[14px] font-semibold text-foreground">{lightstick}</p>
                    </div>
                )}

                <div>
                    <p className="font-mono text-[10px] text-muted uppercase tracking-wider font-bold">Grupos</p>
                    <p className="text-[14px] font-semibold text-foreground">{groupCount}</p>
                </div>

                {artistCount > 0 && (
                    <div>
                        <p className="font-mono text-[10px] text-muted uppercase tracking-wider font-bold">Artistas</p>
                        <p className="text-[14px] font-semibold text-foreground">{artistCount}</p>
                    </div>
                )}
            </div>

            {ADSENSE.slots.inline && <AdSlotInline slot={ADSENSE.slots.inline} layout="sidebar" analyticsPlacement="fandom_profile_sidebar" />}
        </aside>
    )
}
