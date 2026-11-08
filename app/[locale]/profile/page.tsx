import Pagina, { metadataDaPagina } from '@/components/conta/PerfilPagina'
import { paginaLocalizada } from '@/lib/i18n/pagina-localizada'

// Conta: sempre dinâmica (sessão) e noindex. Fora do português é o mesmo corpo, com aviso de falta de tradução.
export const dynamic = 'force-dynamic'

const pagina = paginaLocalizada({
    metadata: ({ locale }) => metadataDaPagina(locale),
    render: ({ locale }) => <Pagina locale={locale} />,
})

export const generateMetadata = pagina.generateMetadata
export default pagina.Page
