import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import { redirect } from 'next/navigation'
import { LojaListagem, metadataLoja, type SearchParams } from '@/components/loja/LojaListagem'

// Rota interna: o rewrite de lib/i18n/rotas-migradas.mjs manda /loja?<filtro> para cá, mantendo a URL pública.
// O canonical continua apontando para /loja.
export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return idiomaValido(locale, { servePt: true }) && locale === DEFAULT_LOCALE ? metadataLoja : {}
}

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale !== DEFAULT_LOCALE) notFound()
    if (Object.keys(await searchParams).length === 0) redirect('/loja')
    return <LojaListagem searchParams={searchParams} />
}
