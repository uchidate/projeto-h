import { CorrectionsPage } from '@/components/institucional/CorrectionsPage'
import { metadataInstitucional } from '@/components/institucional/Texto'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

const pagina = paginaLocalizada({
    metadata: ({ locale }) => metadataInstitucional('corrections', locale),
    render: ({ locale }) => <CorrectionsPage locale={locale} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
