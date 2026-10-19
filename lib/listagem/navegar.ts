// Navegação das listagens com filtro, paginação ou busca.
//
// Por que não router.push / <Link>: sem query, /artists, /groups, /productions,
// /blog, /loja e /comidas são páginas estáticas (ver next.config.mjs, desvios
// para <lista>/filtrado). Em produção o roteador do navegador trata uma página
// estática como igual para qualquer query e reaproveita o payload sem filtro:
// o endereço muda e a lista continua a mesma. Carregar o endereço direto sempre
// funcionou; só a troca sem recarregar não. A navegação completa pega o HTML
// filtrado, que o ISR serve do cache.

/** Listagens que desviam para <lista>/filtrado quando há query (next.config.mjs). */
export const LISTAGENS_COM_FILTRO = ['/artists', '/groups', '/productions', '/blog', '/loja', '/comidas', '/guias']

const FOCO_BUSCA = 'hh_foco_busca'

/** true se o endereço é uma dessas listagens com query: o que exige navegação completa. */
export function exigeNavegacaoCompleta(href: string, origem: string): boolean {
    let url: URL
    try { url = new URL(href, origem) } catch { return false }
    if (url.origin !== origem) return false
    if (!url.search) return false
    const caminho = url.pathname.replace(/\/$/, '')
    return LISTAGENS_COM_FILTRO.includes(caminho)
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
