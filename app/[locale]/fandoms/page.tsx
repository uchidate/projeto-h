import Fandoms, { generateMetadata as metadataDaPagina } from '@/components/fandoms/FandomsIndex'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

export const revalidate = 600

type SearchParams = Parameters<typeof Fandoms>[0]['searchParams']

const pagina = paginaLocalizada<object, SearchParams>({
    comSearchParams: true,
    metadata: ({ locale, searchParams }) => metadataDaPagina({ searchParams, locale }),
    render: ({ locale, searchParams }) => <Fandoms searchParams={searchParams} locale={locale} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
