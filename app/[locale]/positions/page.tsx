import PositionsIndexPage, { metadataDaPagina } from '@/components/positions/PositionsIndex'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

export const revalidate = 3600

const pagina = paginaLocalizada({
    metadata: ({ locale }) => metadataDaPagina(locale),
    render: ({ locale }) => <PositionsIndexPage locale={locale} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
