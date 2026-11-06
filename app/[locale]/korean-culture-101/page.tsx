import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import CulturaCoreana101Page, { buildCulturaMetadata } from '@/components/cultura/Cultura101Pagina'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 3600

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return buildCulturaMetadata(locale)
}

export default async function IntlCultura101Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return <CulturaCoreana101Page locale={locale} />
}
