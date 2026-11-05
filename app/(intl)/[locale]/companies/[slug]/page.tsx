import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import CompanyPage, { generateMetadata as metadataEmPortugues, slugsPreGerados } from '@/components/companies/CompanyDetail'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 600

type Params = Promise<{ locale: string; slug: string }>

// Pré-geração só do português. O filho devolve SEMPRE `{ locale, slug }` completos: se devolvesse
// vazio para `en`, o Next repassaria `{ locale: 'en' }` sem `slug` e, por haver um conjunto
// incompleto, desistiria de pré-gerar TODOS os slugs. Os outros idiomas renderizam sob demanda com ISR.
export async function generateStaticParams() {
    return (await slugsPreGerados()).map(item => ({ locale: DEFAULT_LOCALE, ...item }))
}

/** Português: a ficha. Outros idiomas: a mesma ficha com o aviso de que ainda não há tradução. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    const metadata = await metadataEmPortugues({ params: Promise.resolve({ slug }) })
    return locale === DEFAULT_LOCALE ? metadata : comoFallback(metadata)
}

export default async function Page({ params }: { params: Params }) {
    const { locale, slug } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale === DEFAULT_LOCALE) return <CompanyPage params={Promise.resolve({ slug })} />
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('company', { slug }, DEFAULT_LOCALE)} />
            <CompanyPage params={Promise.resolve({ slug })} />
        </>
    )
}
