// Navegação das listagens com filtro, paginação ou busca.
//
// Por que não router.push / <Link>: sem query, /artists, /groups, /productions,
// /blog, /loja e /comidas são páginas estáticas (ver next.config.mjs, desvios
// para <lista>/filtrado). Em produção o roteador do navegador trata uma página
// estática como igual para qualquer query e reaproveita o payload sem filtro:
// o endereço muda e a lista continua a mesma. Carregar o endereço direto sempre
// funcionou; só a troca sem recarregar não. A navegação completa pega o HTML
// filtrado, que o ISR serve do cache.
//
// Vale para todos os idiomas: /ja/artists?page=2 e /en/groups?page=2 têm o mesmo
// problema. A lista antes só tinha os caminhos em português, e fora dele o clique
// em "2" mudava o endereço e deixava a lista da página 1 (relatado em 2026-11-13).

import { LOCALES } from '@/lib/i18n/idiomas.mjs'
import { localizarCaminho } from '@/lib/i18n/localizar-caminho'

/** Listagens que desviam para <lista>/filtrado quando há query (next.config.mjs). */
export const LISTAGENS_COM_FILTRO = ['/artists', '/groups', '/productions', '/blog', '/loja', '/comidas', '/guias']

/** Os mesmos caminhos em cada idioma (`/artists`, `/en/artists`, `/ja/artists`…), pelo registro de rotas. */
const CAMINHOS_COM_FILTRO = new Set(
    LISTAGENS_COM_FILTRO.flatMap((caminho) => LOCALES.map((locale) => localizarCaminho(caminho, locale))),
)

/**
 * Páginas de detalhe que também paginam/filtram por query e desviam para `<página>/filtrado`
 * (`/guias/:slug`, em rotas-migradas.mjs). O mesmo defeito: o clique em "2" dentro de um guia
 * mudava o endereço e deixava a lista da página 1.
 */
export const DETALHES_COM_FILTRO = ['/guias']

const PREFIXOS_DE_DETALHE_COM_FILTRO = new Set(
    DETALHES_COM_FILTRO.flatMap((caminho) => LOCALES.map((locale) => localizarCaminho(caminho, locale))),
)

function ehDetalheComFiltro(caminho: string): boolean {
    const corte = caminho.lastIndexOf('/')
    if (corte <= 0) return false
    return PREFIXOS_DE_DETALHE_COM_FILTRO.has(caminho.slice(0, corte))
}

const FOCO_BUSCA = 'hh_foco_busca'

/** true se o endereço é uma dessas listagens com query: o que exige navegação completa. */
export function exigeNavegacaoCompleta(href: string, origem: string): boolean {
    let url: URL
    try { url = new URL(href, origem) } catch { return false }
    if (url.origin !== origem) return false
    if (!url.search) return false
    const caminho = url.pathname.replace(/\/$/, '')
    return CAMINHOS_COM_FILTRO.has(caminho) || ehDetalheComFiltro(caminho)
}

export function navegarListagem(url: string, opcoes: { manterFocoBusca?: boolean } = {}) {
    if (opcoes.manterFocoBusca) {
        try { sessionStorage.setItem(FOCO_BUSCA, '1') } catch { /* sem storage: só perde o foco */ }
    }
    window.location.assign(url)
}

/** Lê e apaga o aviso de que a busca recarregou a página e o campo deve voltar a ter foco. */
export function consumirFocoBusca(): boolean {
    try {
        if (sessionStorage.getItem(FOCO_BUSCA) !== '1') return false
        sessionStorage.removeItem(FOCO_BUSCA)
        return true
    } catch { return false }
}

const ROLAGEM = 'hh_rolagem_listagem'

/** Guarda a rolagem atual quando o destino é a mesma listagem (paginação, filtro): a navegação completa recarrega a página. */
export function guardarRolagem(destino: URL) {
    try {
        if (destino.pathname !== window.location.pathname) return
        sessionStorage.setItem(ROLAGEM, JSON.stringify({ caminho: destino.pathname, y: window.scrollY }))
    } catch { /* sem storage: a página abre no topo */ }
}

/** Posição guardada por guardarRolagem para este caminho, lida e apagada uma vez. */
export function consumirRolagem(caminho: string): number | null {
    try {
        const bruto = sessionStorage.getItem(ROLAGEM)
        if (!bruto) return null
        sessionStorage.removeItem(ROLAGEM)
        const { caminho: guardado, y } = JSON.parse(bruto) as { caminho: string; y: number }
        return guardado === caminho && Number.isFinite(y) ? y : null
    } catch { return null }
}
