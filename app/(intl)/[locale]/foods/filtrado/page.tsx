import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { ComidasListagem, metadataComidas, type SearchParams } from '@/components/comidas/ComidasListagem'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

// Rota interna: o rewrite de lib/i18n/rotas-migradas.mjs manda `/comidas?<filtro>` (e `/en/foods?<filtro>`)
// para cá, mantendo a URL pública. Canonical e robots saem da mesma lógica da listagem.
export const revalidate = 600

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    const metadata = await metadataComidas({ searchParams })
    return locale === DEFAULT_LOCALE ? metadata : comoFallback(metadata)
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    if (Object.keys(await searchParams).length === 0) redirect(href('foods', undefined, locale))
    if (locale === DEFAULT_LOCALE) return <ComidasListagem searchParams={searchParams} />
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('foods', undefined, DEFAULT_LOCALE)} />
            <ComidasListagem searchParams={searchParams} />
        </>
    )
}
