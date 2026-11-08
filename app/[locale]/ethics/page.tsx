import { EthicsPage } from '@/components/institucional/EthicsPage'
import { metadataInstitucional } from '@/components/institucional/Texto'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

const pagina = paginaLocalizada({
    metadata: ({ locale }) => metadataInstitucional('ethics', locale),
    render: ({ locale }) => <EthicsPage locale={locale} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
