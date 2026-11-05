import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import Pagina, { generateMetadata as metadataEmPortugues } from '@/components/loja/LojaComida'

// Só em português por decisão do manifesto (lib/i18n/route-manifest.ts): em outro idioma, 404.
export const revalidate = 300

type Params = Promise<{ locale: string; slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!idiomaValido(locale, { servePt: true }) || locale !== DEFAULT_LOCALE) return {}
    return metadataEmPortugues({ params: Promise.resolve({ slug }) })
}

export default async function Page({ params }: { params: Params }) {
    const { locale, slug } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale !== DEFAULT_LOCALE) notFound()
    return <Pagina params={Promise.resolve({ slug })} />
}
