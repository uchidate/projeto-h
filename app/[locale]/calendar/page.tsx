import CalendarioPage, { generateMetadata as metadataDoCalendario } from '@/components/calendario/CalendarioIndex'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

export const revalidate = 3600

const pagina = paginaLocalizada({
    metadata: ({ locale }) => metadataDoCalendario({ locale }),
    render: ({ locale }) => <CalendarioPage locale={locale} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
