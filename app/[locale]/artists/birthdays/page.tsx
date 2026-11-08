import BirthdaysPage, { metadataDaPagina } from '@/components/birthdays/BirthdaysIndex'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

export const revalidate = 3600

type SearchParams = Parameters<typeof BirthdaysPage>[0]['searchParams']

const pagina = paginaLocalizada<object, SearchParams>({
    comSearchParams: true,
    metadata: ({ locale, searchParams }) => metadataDaPagina({ searchParams, locale }),
    render: ({ locale, searchParams }) => <BirthdaysPage searchParams={searchParams} locale={locale} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
