import type { Metadata } from 'next'
import { PaginaNaoEncontrada } from '@/components/features/PaginaNaoEncontrada'

export const metadata: Metadata = {
    title: 'Página não encontrada',
    robots: { index: false, follow: true },
}

/**
 * 404 de página dentro de um idioma ativo (ex.: ficha sem tradução). O layout
 * de `[locale]` já montou o casco; `app/(intl)/not-found.tsx` fica só para o
 * 404 do próprio layout, que acontece antes do casco existir.
 */
export default function LocaleNaoEncontrado() {
    return <PaginaNaoEncontrada />
}
