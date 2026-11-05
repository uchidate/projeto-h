import type { Metadata } from 'next'
import { SiteShell } from '@/components/layout/SiteShell'
import { PaginaNaoEncontrada } from '@/components/features/PaginaNaoEncontrada'

export const metadata: Metadata = {
    title: 'Página não encontrada',
    robots: { index: false, follow: true },
}

/**
 * 404 para `/pt/...` e idiomas desligados. O layout de `[locale]` chama
 * `notFound()` antes de montar o casco, então este arquivo o monta por conta
 * própria — acima dele só há `app/layout.tsx`, que não renderiza `<html>`.
 */
export default function IntlNaoEncontrado() {
    return (
        <SiteShell locale="pt">
            <PaginaNaoEncontrada />
        </SiteShell>
    )
}
