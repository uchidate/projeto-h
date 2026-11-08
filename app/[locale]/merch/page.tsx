import Pagina, { metadata as metadataEmPortugues } from '@/components/merch/MerchPagina'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

// Só em português por decisão do manifesto (lib/i18n/route-manifest.ts): em outro idioma, 404.
export const revalidate = 600

const pagina = paginaLocalizada({
    soPortugues: true,
    metadata: () => metadataEmPortugues,
    render: () => <Pagina />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
