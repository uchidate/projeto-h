import { AboutPage } from '@/components/institucional/AboutPage'
import { metadataInstitucional } from '@/components/institucional/Texto'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

const pagina = paginaLocalizada({
    metadata: ({ locale }) => metadataInstitucional('about', locale),
    render: ({ locale }) => <AboutPage locale={locale} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
