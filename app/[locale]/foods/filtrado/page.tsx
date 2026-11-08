import { redirect } from 'next/navigation'
import { href } from '@/lib/i18n/routes'
import { ComidasListagem, metadataComidas, type SearchParams } from '@/components/comidas/ComidasListagem'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

// Rota interna: o rewrite de lib/i18n/rotas-migradas.mjs manda `/comidas?<filtro>` (e `/en/foods?<filtro>`)
// para cá, mantendo a URL pública. Canonical e robots saem da mesma lógica da listagem.
export const revalidate = 600

const pagina = paginaLocalizada<object, SearchParams>({
    comSearchParams: true,
    metadata: ({ locale, searchParams }) => metadataComidas({ searchParams, locale }),
    render: async ({ locale, searchParams }) => {
        if (Object.keys(await searchParams).length === 0) redirect(href('foods', undefined, locale))
        return <ComidasListagem searchParams={searchParams} locale={locale} />
    },
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
