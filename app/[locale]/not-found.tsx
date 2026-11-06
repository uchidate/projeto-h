import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { PaginaNaoEncontrada } from '@/components/features/PaginaNaoEncontrada'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations({ locale: await getLocale(), namespace: 'client.notFound' })
    return { title: t('metaTitulo'), robots: { index: false, follow: true } }
}

/**
 * 404 de página dentro de um idioma ativo (ex.: ficha sem tradução). O layout
 * de `[locale]` já montou o casco; `app/not-found.tsx` fica só para o
 * 404 do próprio layout, que acontece antes do casco existir.
 */
export default function LocaleNaoEncontrado() {
    return <PaginaNaoEncontrada />
}
