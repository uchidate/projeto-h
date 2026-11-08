import { redirect } from 'next/navigation'
import { ProductionsListagem, metadataProductionsListagem, type SearchParams } from '@/components/productions/ProductionsListagem'
import { href } from '@/lib/i18n/routes'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

// Rota interna: o rewrite de lib/i18n/rotas-migradas.mjs manda `/productions?<filtro>` (e `/en/productions?page=`)
// para cá, mantendo a URL pública. Canonical e robots saem da mesma lógica da listagem.
export const revalidate = 600

const pagina = paginaLocalizada<object, SearchParams>({
    comSearchParams: true,
    metadata: ({ locale, searchParams }) => metadataProductionsListagem({ searchParams, locale }),
    render: async ({ locale, searchParams }) => {
        if (Object.keys(await searchParams).length === 0) redirect(href('productions', undefined, locale))
        return <ProductionsListagem searchParams={searchParams} locale={locale} />
    },
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
