import { GroupsListagem, metadataGroupsListagem } from '@/components/groups/GroupsListagem'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

// Estática de propósito, nos dois idiomas: ler `searchParams` aqui tornaria a rota dinâmica
// (`cache-control: no-store`). Com filtro, paginação ou busca, um rewrite (lista em
// lib/i18n/rotas-migradas.mjs) manda a mesma URL para ./filtrado, que lê a query.
export const revalidate = 600

const SEM_FILTRO = Promise.resolve({})

const pagina = paginaLocalizada({
    metadata: ({ locale }) => metadataGroupsListagem({ searchParams: SEM_FILTRO, locale }),
    render: ({ locale }) => <GroupsListagem searchParams={SEM_FILTRO} locale={locale} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
