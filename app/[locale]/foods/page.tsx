import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { ComidasListagem, metadataComidas } from '@/components/comidas/ComidasListagem'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

// Estática de propósito: ler `searchParams` aqui tornaria a rota dinâmica (`cache-control: no-store`).
// Com filtro, paginação ou busca, um rewrite (lib/i18n/rotas-migradas.mjs) manda a mesma URL para
// ./filtrado, que lê a query.
export const revalidate = 600

type Params = Promise<{ locale: string }>

const SEM_FILTRO = Promise.resolve({})

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    const metadata = await metadataComidas({ searchParams: SEM_FILTRO })
    return locale === DEFAULT_LOCALE ? metadata : comoFallback(metadata)
}

export default async function Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale === DEFAULT_LOCALE) return <ComidasListagem searchParams={SEM_FILTRO} />
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('foods', undefined, DEFAULT_LOCALE)} />
            <ComidasListagem searchParams={SEM_FILTRO} />
        </>
    )
}
