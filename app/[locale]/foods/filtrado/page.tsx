import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { ComidasListagem, metadataComidas, type SearchParams } from '@/components/comidas/ComidasListagem'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

// Rota interna: o rewrite de lib/i18n/rotas-migradas.mjs manda `/comidas?<filtro>` (e `/en/foods?<filtro>`)
// para cá, mantendo a URL pública. Canonical e robots saem da mesma lógica da listagem.
// Fora do português o catálogo não tem filtros: o endereço com filtro volta para a listagem.
export const revalidate = 600

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true }) || locale !== DEFAULT_LOCALE) return {}
    return metadataComidas({ searchParams })
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale !== DEFAULT_LOCALE || Object.keys(await searchParams).length === 0) redirect(href('foods', undefined, locale))
    return <ComidasListagem searchParams={searchParams} />
}
