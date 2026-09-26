import { AdSlot } from '@/components/ui/AdSlot'

export const TALL_SIDEBAR_MIN_READING_MINUTES = 6

interface Props {
    slot: string
    readingMinutes: number
    /** Altura mínima da janela para o 300×600. Com o índice fixo junto, o teste usa um limite maior. */
    alturaAlta?: number
}

const DESKTOP = '(min-width: 1280px)'

/**
 * Artigos longos oferecem tempo de exposição suficiente para o inventário
 * vertical responsivo (até 300×600). Em notebooks baixos, preserva 300×250
 * para que o criativo inteiro caiba na área sticky e mantenha viewability.
 */
export function ArticleSidebarAd({ slot, readingMinutes, alturaAlta = 850 }: Props) {
    const TALL_DESKTOP = `(min-width: 1280px) and (min-height: ${alturaAlta}px)`
    const SHORT_DESKTOP = `(min-width: 1280px) and (max-height: ${alturaAlta - 1}px)`
    const common = {
        slot,
        label: true,
        className: 'w-[300px] max-w-full',
    } as const

    if (readingMinutes < TALL_SIDEBAR_MIN_READING_MINUTES) {
        return (
            <AdSlot
                {...common}
                format="rectangle"
                analyticsPlacement="article_sidebar"
                mediaQuery={DESKTOP}
            />
        )
    }

    return (
        <>
            <AdSlot
                {...common}
                format="vertical"
                analyticsPlacement="article_sidebar_tall"
                mediaQuery={TALL_DESKTOP}
            />
            <AdSlot
                {...common}
                format="rectangle"
                analyticsPlacement="article_sidebar"
                mediaQuery={SHORT_DESKTOP}
            />
        </>
    )
}
