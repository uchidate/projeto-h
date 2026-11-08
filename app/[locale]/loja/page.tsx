import { LojaListagem, metadataLoja } from '@/components/loja/LojaListagem'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

// Só em português por decisão do manifesto (lib/i18n/route-manifest.ts): em outro idioma, 404.
// Estática de propósito: ler `searchParams` aqui tornaria a rota dinâmica (`cache-control: no-store`).
// Com filtro ou busca, um rewrite de lib/i18n/rotas-migradas.mjs manda a mesma URL para ./filtrado.
export const revalidate = 300

const SEM_FILTRO = Promise.resolve({})

const pagina = paginaLocalizada({
    soPortugues: true,
    metadata: () => metadataLoja,
    render: () => <LojaListagem searchParams={SEM_FILTRO} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
