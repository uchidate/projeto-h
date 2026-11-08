import SearchPage, { metadataDaPagina } from '@/components/search/SearchIndex'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

export const revalidate = 0

type SearchParams = Parameters<typeof SearchPage>[0]['searchParams']

const pagina = paginaLocalizada<object, SearchParams>({
    comSearchParams: true,
    metadata: ({ locale, searchParams }) => metadataDaPagina({ searchParams, locale }),
    render: ({ locale, searchParams }) => <SearchPage searchParams={searchParams} locale={locale} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
