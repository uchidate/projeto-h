import type { Metadata } from 'next'
import { EditorialStandardsPage } from '@/components/institucional/EditorialStandardsPage'
import { metadataInstitucional } from '@/components/institucional/Texto'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale)) return {}
    return metadataInstitucional('editorialStandards', locale)
}

export default async function Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale)
    return <EditorialStandardsPage locale={locale} />
}
