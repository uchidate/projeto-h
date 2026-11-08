import { redirect } from 'next/navigation'
import { LojaListagem, metadataLoja, type SearchParams } from '@/components/loja/LojaListagem'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

// Rota interna: o rewrite de lib/i18n/rotas-migradas.mjs manda /loja?<filtro> para cá, mantendo a URL pública.
// O canonical continua apontando para /loja.
export const revalidate = 300

const pagina = paginaLocalizada<object, SearchParams>({
    soPortugues: true,
    comSearchParams: true,
    metadata: () => metadataLoja,
    render: async ({ searchParams }) => {
        if (Object.keys(await searchParams).length === 0) redirect('/loja')
        return <LojaListagem searchParams={searchParams} />
    },
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
