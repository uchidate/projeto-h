import type { Metadata } from 'next'
import Pagina, { metadataDaPagina } from '@/components/conta/ConquistasPagina'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import type { Locale } from '@/lib/i18n/config'

// Conta: sempre dinâmica (sessão) e noindex.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return idiomaValido(locale, { servePt: true }) ? metadataDaPagina(locale as Locale) : {}
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return <Pagina locale={locale as Locale} />
}
