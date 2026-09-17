import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'

interface Props {
    analyticsPlacement: string
}

/** A coluna lateral existe a partir de xl (1280px); abaixo disso o bloco tem largura 0. */
const SO_NA_COLUNA_LATERAL = '(min-width: 1280px)'

/**
 * Contrato único para anúncios nas colunas laterais de perfis.
 *
 * O retângulo 300x250 é solicitado assim que a sidebar desktop monta. Isso
 * evita depender de rolagem no Safari/WebKit e mantém a mesma geometria em
 * artistas, grupos e produções. AdSlotInline remove todo o wrapper quando o
 * leilão não preenche, portanto a coluna não conserva um buraco vazio.
 */
export function ProfileSidebarAd({ analyticsPlacement }: Props) {
    if (!ADSENSE.slots.inline) return null

    return (
        <div data-profile-sidebar-ad>
            <AdSlotInline
                slot={ADSENSE.slots.inline}
                layout="sidebar"
                analyticsPlacement={analyticsPlacement}
                mediaQuery={SO_NA_COLUNA_LATERAL}
            />
        </div>
    )
}
