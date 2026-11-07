import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ProductionsListagem, metadataProductionsListagem, type SearchParams } from '@/components/productions/ProductionsListagem'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import { href } from '@/lib/i18n/routes'

// Rota interna: o rewrite de lib/i18n/rotas-migradas.mjs manda `/productions?<filtro>` (e `/en/productions?page=`)
// para cá, mantendo a URL pública. Canonical e robots saem da mesma lógica da listagem.
export const revalidate = 600

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return metadataProductionsListagem({ searchParams, locale })
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    const sp = await searchParams
    if (Object.keys(sp).length === 0) redirect(href('productions', undefined, locale))
    return <ProductionsListagem searchParams={searchParams} locale={locale} />
}
