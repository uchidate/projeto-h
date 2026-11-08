import Pagina, { metadataDaPagina } from '@/components/conta/MinhasListasPagina'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

// Conta: sempre dinâmica (sessão) e noindex. Fora do português é o mesmo corpo, com aviso de falta de tradução.
export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ tab?: string }>

const pagina = paginaLocalizada<object, SearchParams>({
    comSearchParams: true,
    metadata: ({ locale }) => metadataDaPagina(locale),
    render: ({ locale, searchParams }) => <Pagina locale={locale} searchParams={searchParams} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
