import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import CompanyPage, { generateMetadata as metadataEmPortugues } from '@/app/(site)/empresas/[slug]/page'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 600

type Params = Promise<{ locale: string; slug: string }>

// Sem pré-geração: renderização sob demanda com ISR, como as fichas traduzidas.
export function generateStaticParams() {
    return []
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!idiomaValido(locale)) return {}
    return comoFallback(await metadataEmPortugues({ params: Promise.resolve({ slug }) }))
}

export default async function IntlCompanyPage({ params }: { params: Params }) {
    const { locale, slug } = await params
    entrarNaPagina(locale)
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('company', { slug }, DEFAULT_LOCALE)} />
            <CompanyPage params={Promise.resolve({ slug })} />
        </>
    )
}
