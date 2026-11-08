import Pagina, { generateMetadata as metadataEmPortugues } from '@/components/loja/LojaGrupo'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

// Só em português por decisão do manifesto (lib/i18n/route-manifest.ts): em outro idioma, 404.
export const revalidate = 300

const pagina = paginaLocalizada<{ slug: string }>({
    soPortugues: true,
    metadata: ({ params }) => metadataEmPortugues({ params: Promise.resolve(params) }),
    render: ({ params }) => <Pagina params={Promise.resolve(params)} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
