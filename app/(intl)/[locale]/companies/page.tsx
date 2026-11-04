import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import EmpresasPage, { generateMetadata as metadataEmPortugues } from '@/app/(site)/empresas/page'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 600

type Params = Promise<{ locale: string }>
type SearchParams = Promise<{ search?: string; page?: string; industry?: string; chaebol?: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale)) return {}
    return comoFallback(await metadataEmPortugues())
}

export default async function IntlCompaniesPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale)
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('companies', undefined, DEFAULT_LOCALE)} />
            <EmpresasPage searchParams={searchParams} />
        </>
    )
}
