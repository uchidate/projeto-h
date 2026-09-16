import { AdSlot } from '@/components/ui/AdSlot'

export const TALL_SIDEBAR_MIN_READING_MINUTES = 6

interface Props {
    slot: string
    readingMinutes: number
}

const DESKTOP = '(min-width: 1280px)'
const TALL_DESKTOP = '(min-width: 1280px) and (min-height: 850px)'
const SHORT_DESKTOP = '(min-width: 1280px) and (max-height: 849px)'

/**
 * Artigos longos oferecem tempo de exposição suficiente para o inventário
 * vertical responsivo (até 300×600). Em notebooks baixos, preserva 300×250
 * para que o criativo inteiro caiba na área sticky e mantenha viewability.
 */
export function ArticleSidebarAd({ slot, readingMinutes }: Props) {
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
