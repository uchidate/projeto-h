import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { OutrasTorcidas, type TorcidaVizinha } from './OutrasTorcidas'

interface Props {
    lightstick: string | null
    outras: TorcidaVizinha[]
}

/** Coluna lateral: o que a página do banner ainda não disse (lightstick) e outras torcidas para descobrir, com o anúncio embaixo. */
export function FandomSidebarFicha({ lightstick, outras }: Props) {
    return (
        <aside
            aria-label="Mais sobre a torcida"
            className="hidden xl:flex flex-col gap-6 w-[260px] shrink-0 sticky top-[calc(var(--site-header-h)+var(--reading-bar-h,42px)+16px)]"
        >
            {lightstick && (
                <div className="border-2 border-border bg-surface p-4">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-muted">Lightstick</p>
                    <p className="mt-1 text-[18px] font-black leading-tight">💡 {lightstick}</p>
                </div>
            )}
            <OutrasTorcidas torcidas={outras.slice(0, 5)} coluna />
            {ADSENSE.slots.inline && <AdSlotInline slot={ADSENSE.slots.inline} layout="sidebar" analyticsPlacement="fandom_profile_sidebar" />}
        </aside>
    )
}
