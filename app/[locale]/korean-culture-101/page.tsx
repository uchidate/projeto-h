import CulturaCoreana101Page, { buildCulturaMetadata } from '@/components/cultura/Cultura101Pagina'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

export const revalidate = 3600

const pagina = paginaLocalizada({
    metadata: ({ locale }) => buildCulturaMetadata(locale),
    render: ({ locale }) => <CulturaCoreana101Page locale={locale} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
