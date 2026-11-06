import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n/config'
import CalendarioPage, { generateMetadata as metadataDoCalendario } from '@/components/calendario/CalendarioIndex'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 3600

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return metadataDoCalendario({ locale: locale as Locale })
}

/** O calendário existe em português e inglês (os dados são os mesmos; só os textos e os links mudam). */
export default async function Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return <CalendarioPage locale={locale as Locale} />
}
