import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import Pagina, { metadata as metadataEmPortugues } from '@/components/conta/ConquistasPagina'

// Só em português por decisão do manifesto (lib/i18n/route-manifest.ts): em outro idioma, 404.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return idiomaValido(locale, { servePt: true }) && locale === DEFAULT_LOCALE ? metadataEmPortugues : {}
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale !== DEFAULT_LOCALE) notFound()
    return <Pagina />
}
