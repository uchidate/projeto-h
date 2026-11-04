import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ArtistsListagem, metadataArtistsListagem, type SearchParams } from '@/components/artists/ArtistsListagem'
import { LocalizedCatalog, buildCatalogMetadata } from '@/components/features/LocalizedCatalog'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import { href } from '@/lib/i18n/routes'

// Rota interna: o rewrite de lib/i18n/rotas-migradas.mjs manda `/artists?<filtro>` (e `/en/artists?page=`)
// para cá, mantendo a URL pública. Canonical e robots saem da mesma lógica da listagem.
export const revalidate = 600

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return locale === DEFAULT_LOCALE
        ? metadataArtistsListagem({ searchParams })
        : buildCatalogMetadata('artists', locale, (await searchParams).page)
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    const sp = await searchParams
    if (Object.keys(sp).length === 0) redirect(href('artists', undefined, locale))
    return locale === DEFAULT_LOCALE
        ? <ArtistsListagem searchParams={searchParams} />
        : <LocalizedCatalog kind="artists" locale={locale} pageParam={sp.page} />
}
