import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { GuiasIndice, buildGuiasMetadata } from '@/components/guias/GuiasIndice'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

// Rota interna: o rewrite de lib/i18n/rotas-migradas.mjs manda `/guias?kind=…` para cá, mantendo a
// URL pública. O canonical continua apontando para /guias, como antes do desvio.
type Params = Promise<{ locale: string }>
type SearchParams = Promise<{ kind?: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return locale === DEFAULT_LOCALE ? buildGuiasMetadata() : comoFallback(buildGuiasMetadata())
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    const { kind } = await searchParams
    if (!kind) redirect(href('guides', undefined, locale))
    if (locale === DEFAULT_LOCALE) return <GuiasIndice kind={kind} />
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('guides', undefined, DEFAULT_LOCALE)} />
            <GuiasIndice kind={kind} />
        </>
    )
}
