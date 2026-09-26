import { AdSlot } from '@/components/ui/AdSlot'

const ALTURA_ALTA = 1150
const DESKTOP = '(min-width: 1280px)'

/**
 * Anúncio da lateral fixa da lista do blog. O topo fixo do site ocupa ~284px, então o 300×600 só cabe
 * em janelas de 1150px de altura ou mais; abaixo disso vai o retângulo 300×250.
 */
export function BlogListaSidebarAd({ slot }: { slot: string }) {
    const common = { slot, label: true, className: 'w-[300px] max-w-full' } as const
    return (
        <>
            <AdSlot {...common} format="vertical" analyticsPlacement="blog_sidebar_tall" mediaQuery={`${DESKTOP} and (min-height: ${ALTURA_ALTA}px)`} />
            <AdSlot {...common} format="rectangle" analyticsPlacement="blog_sidebar" mediaQuery={`${DESKTOP} and (max-height: ${ALTURA_ALTA - 1}px)`} />
        </>
    )
}
