import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/constants/site'
import { SiteShell } from '@/components/layout/SiteShell'
import { PaginaNaoEncontrada } from '@/components/features/PaginaNaoEncontrada'

export const metadata: Metadata = {
    title: `Página não encontrada | ${SITE_NAME}`,
    robots: { index: false, follow: true },
}

/**
 * 404 de URL que não casa com rota nenhuma (ex.: `/xx`).
 *
 * `app/not-found.tsx` só cobre o `notFound()` do layout de `[locale]` (idioma inválido). Como o
 * `app/layout.tsx` de topo só repassa `children` e o casco (`<html>`) vem do layout de `[locale]`,
 * a URL sem rota (ex.: `/xx`) caía no 404 padrão do Next, sem menu nem saída. Esta convenção (flag
 * `experimental.globalNotFound`) é a indicada pelo Next para esse caso; ela
 * ignora os layouts, por isso monta o casco completo por conta própria.
 */
export default function GlobalNotFound() {
    return (
        <SiteShell locale="pt">
            <PaginaNaoEncontrada />
        </SiteShell>
    )
}
