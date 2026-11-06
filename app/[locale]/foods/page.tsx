import type { Metadata } from 'next'
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
    return metadataComidas({ searchParams: SEM_FILTRO, locale })
}

export default async function Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return <ComidasListagem searchParams={SEM_FILTRO} locale={locale} />
}
