import { ContactPage } from '@/components/institucional/ContactPage'
import { metadataInstitucional } from '@/components/institucional/Texto'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

const pagina = paginaLocalizada({
    metadata: ({ locale }) => metadataInstitucional('contact', locale),
    render: ({ locale }) => <ContactPage locale={locale} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
