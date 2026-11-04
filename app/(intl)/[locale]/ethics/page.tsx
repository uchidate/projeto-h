import type { Metadata } from 'next'
import { EthicsPage } from '@/components/institucional/EthicsPage'
import { metadataInstitucional } from '@/components/institucional/Texto'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return metadataInstitucional('ethics', locale)
}

export default async function Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return <EthicsPage locale={locale} />
}
