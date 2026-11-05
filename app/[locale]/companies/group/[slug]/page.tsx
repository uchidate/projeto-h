import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import ChaebolGroupPage, { generateMetadata as metadataEmPortugues, slugsPreGerados } from '@/components/companies/ChaebolGroup'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 1800

type Params = Promise<{ locale: string; slug: string }>

// Pré-geração só do português, com `locale` sempre completo (sem isso o Next desiste de pré-gerar tudo).
export async function generateStaticParams() {
    return (await slugsPreGerados()).map(item => ({ locale: DEFAULT_LOCALE, ...item }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    const metadata = await metadataEmPortugues({ params: Promise.resolve({ slug }) })
    return locale === DEFAULT_LOCALE ? metadata : comoFallback(metadata)
}

export default async function Page({ params }: { params: Params }) {
    const { locale, slug } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale === DEFAULT_LOCALE) return <ChaebolGroupPage params={Promise.resolve({ slug })} />
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('companyGroup', { slug }, DEFAULT_LOCALE)} />
            <ChaebolGroupPage params={Promise.resolve({ slug })} />
        </>
    )
}
