import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { GuiasIndice, buildGuiasMetadata } from '@/components/guias/GuiasIndice'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

// Estática de propósito: ler `searchParams` aqui tornaria a rota dinâmica
// (`cache-control: no-store`, Cloudflare em BYPASS). O filtro `?kind=` é desviado para
// ./filtrado por um rewrite de lib/i18n/rotas-migradas.mjs.
export const revalidate = 3600

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return locale === DEFAULT_LOCALE ? buildGuiasMetadata() : comoFallback(buildGuiasMetadata())
}

export default async function Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale === DEFAULT_LOCALE) return <GuiasIndice />
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('guides', undefined, DEFAULT_LOCALE)} />
            <GuiasIndice />
        </>
    )
}
