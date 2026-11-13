import { SITE_URL, SITE_NAME } from '@/lib/constants/site'
import { ACTIVE_LOCALES, LOCALE_META, SOURCE_LOCALE, type Locale } from '@/lib/i18n/config'
import { href, type RouteName } from '@/lib/i18n/routes'
import { slugsPtTraduzidos } from '@/lib/guias/i18n'

/** Seções do índice para agentes: rota, nome e o que o leitor encontra ali. Só o que o site realmente publica. */
const SECOES: Array<{ rota: RouteName; nome: string; descricao: string }> = [
    { rota: 'artists', nome: 'Artistas', descricao: 'fichas de artistas coreanos: biografia, carreira, grupos, agência e produções' },
    { rota: 'groups', nome: 'Grupos', descricao: 'fichas de grupos de K-pop: integrantes, estreia, discografia e agência' },
    { rota: 'productions', nome: 'Produções', descricao: 'dramas, filmes e programas coreanos: sinopse, elenco, onde assistir' },
    { rota: 'agencies', nome: 'Agências', descricao: 'agências de entretenimento coreanas e seus artistas' },
    { rota: 'companies', nome: 'Empresas', descricao: 'empresas e marcas coreanas' },
    { rota: 'foods', nome: 'Comidas', descricao: 'pratos coreanos com ingredientes, região e onde encontrar' },
    { rota: 'blog', nome: 'Blog', descricao: 'notícias e reportagens sobre K-pop, K-drama e cultura coreana, com referências' },
    { rota: 'guides', nome: 'Guias', descricao: 'guias de compra e de conteúdo (K-beauty, merch, comida, séries)' },
    { rota: 'calendar', nome: 'Calendário', descricao: 'lançamentos e datas do K-pop e dos dramas' },
    { rota: 'quiz', nome: 'Quiz', descricao: 'perguntas sobre K-pop, K-drama, cultura e história coreana' },
]

const url = (rota: RouteName, locale: Locale) => `${SITE_URL}${href(rota, undefined as never, locale)}`

/**
 * `/llms.txt` — índice em texto para agentes e buscadores de IA (llmstxt.org). Gerado do registro de rotas,
 * então idiomas e caminhos não se descolam do site. Não afirma contagens nem licenças que não estão no código.
 */
export function buildLlmsTxt(): string {
    const idiomas = ACTIVE_LOCALES.map((l) => `${LOCALE_META[l].htmlLang}${l === SOURCE_LOCALE ? ' (original)' : ''}`).join(', ')
    const linhas: string[] = [
        `# ${SITE_NAME}`,
        '',
        `> Enciclopédia e notícias de K-pop, K-drama e cultura coreana em português do Brasil, com versões em ${ACTIVE_LOCALES.filter((l) => l !== SOURCE_LOCALE).map((l) => LOCALE_META[l].htmlLang).join(', ')}. Fichas de artistas, grupos, produções, agências e comidas; reportagens com referências; guias.`,
        '',
        `Idiomas: ${idiomas}. O português é o original; as demais versões são traduções revisadas e só existem para o conteúdo já traduzido.`,
        '',
        'Para citar: use o título e o endereço da página, indique o HallyuHub como fonte. Reportagens trazem as referências no fim do texto. Treino de modelos não é permitido (ver robots.txt); busca e resposta com citação são bem-vindas.',
        '',
    ]
    for (const locale of ACTIVE_LOCALES) {
        linhas.push(`## ${LOCALE_META[locale].htmlLang}`, '')
        for (const s of SECOES) {
            // Guias e quiz só existem nos idiomas com conteúdo traduzido.
            if (s.rota === 'guides' && locale !== SOURCE_LOCALE && slugsPtTraduzidos(locale).length === 0) continue
            linhas.push(`- [${s.nome}](${url(s.rota, locale)}): ${s.descricao}`)
        }
        linhas.push('')
    }
    linhas.push(
        '## Mapas do site',
        '',
        `- [Índice de sitemaps](${SITE_URL}/sitemap-static.xml): todas as páginas por tipo e idioma, com hreflang`,
        `- [Notícias recentes](${SITE_URL}/sitemap-news.xml): artigos das últimas 48 h`,
        `- [Feed RSS](${SITE_URL}/feed.xml): artigos novos`,
        '',
    )
    return linhas.join('\n')
}
