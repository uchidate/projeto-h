import { EditorialStandardsPage } from '@/components/institucional/EditorialStandardsPage'
import { metadataInstitucional } from '@/components/institucional/Texto'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

const pagina = paginaLocalizada({
    metadata: ({ locale }) => metadataInstitucional('editorialStandards', locale),
    render: ({ locale }) => <EditorialStandardsPage locale={locale} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
