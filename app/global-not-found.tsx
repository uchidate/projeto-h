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
 * `app/(site)/not-found.tsx` só cobre `notFound()` chamado dentro de `(site)`.
 * Como o app tem mais de um root layout — `(site)` e `(intl)/[locale]`, e o
 * `app/layout.tsx` de topo só repassa `children` —, a URL sem rota caía no 404
 * padrão do Next, sem menu nem saída. Esta convenção (flag
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
