import type { Metadata } from 'next'
import { AboutPage } from '@/components/institucional/AboutPage'
import { metadataInstitucional } from '@/components/institucional/Texto'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return metadataInstitucional('about', locale)
}

export default async function Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return <AboutPage locale={locale} />
}
