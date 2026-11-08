import TrendingPage, { metadataDaPagina } from '@/components/trending/TrendingPage'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

export const revalidate = 300

const pagina = paginaLocalizada({
    metadata: ({ locale }) => metadataDaPagina(locale),
    render: ({ locale }) => <TrendingPage locale={locale} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
