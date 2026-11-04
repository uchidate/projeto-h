import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { ComidasListagem, metadataComidas } from '@/app/(site)/comidas/ComidasListagem'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 600

type Params = Promise<{ locale: string }>
type SearchParams = Parameters<typeof ComidasListagem>[0]['searchParams']

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale)) return {}
    return comoFallback(await metadataComidas({ searchParams }))
}

export default async function IntlFoodsPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale)
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('foods', undefined, DEFAULT_LOCALE)} />
            <ComidasListagem searchParams={searchParams} />
        </>
    )
}
