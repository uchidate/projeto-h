/**
 * Visitas humanas por guia (páginas /guias/{slug}, 90 dias até 2026-10-25, Umami sem o perfil de robôs).
 * Ordena as listas de /guias pelo que as pessoas realmente abrem; guia fora da tabela mantém a ordem original no fim.
 * Atualizar com scripts/umami-trafego-humano.sh quando a leitura ficar velha.
 */
export const VISITAS_POR_GUIA: Record<string, number> = {
    'doramas-policiais-coreanos': 266,
    'doramas-acao-coreanos': 92,
    'doramas-thriller-coreanos': 81,
    'doramas-tvn': 74,
    'doramas-romanticos': 60,
    'filmes-coreanos': 58,
    'doramas-comedia-coreanos': 36,
    'doramas-terror-coreanos': 36,
    'doramas-esportes-coreanos': 33,
    'doramas-fantasia-coreanos': 33,
    'grupos-3a-geracao-kpop': 31,
    'grupos-4a-geracao-kpop': 24,
    'doramas-kbs': 22,
    'doramas-historicos-coreanos': 21,
    'doramas-tving': 19,
    'doramas-familia-coreanos': 18,
    'doramas-coreanos-2016': 18,
    'doramas-mbc': 16,
    'doramas-ena': 15,
    'doramas-escolares-coreanos': 14,
    'doramas-medicos-coreanos': 14,
    'doramas-jtbc': 14,
    'melhores-doramas-de-todos-os-tempos': 13,
    'doramas-sobrevivencia-coreanos': 13,
    'doramas-ocn': 12,
    'doramas-kocowa': 12,
    'doramas-disney-plus': 11,
    'artistas-solo-kpop': 10,
    'doramas-culinaria-coreanos': 9,
    'doramas-coreanos-2021': 7,
    'doramas-coreanos-2018': 7,
    'artistas-pledis-entertainment': 7,
    'grupos-yg-entertainment': 7,
    'doramas-sbs': 6,
    'grupos-femininos-kpop': 6,
    'doramas-amazon-prime': 6,
    'cantores-kpop': 6,
    'integrantes-do-exo': 5,
    'doramas-coreanos-2025': 5,
    'doramas-misterio-coreanos': 4,
}

/** Mais visitados primeiro; empate e guias sem leitura seguem a ordem de origem (sort é estável). */
export function porDemanda<T extends { slug: string }>(hubs: T[]): T[] {
    return [...hubs].sort((a, b) => (VISITAS_POR_GUIA[b.slug] ?? 0) - (VISITAS_POR_GUIA[a.slug] ?? 0))
}

const CAUDA_PADRAO = /,?\s+(com|e)\s+(sinopse|perfis?|integrantes|elenco|avalia[çc][ãa]o|onde assistir)\b.*$/i

/** Descrição só quando acrescenta algo além do título: tira a cauda padrão ("com sinopse, elenco…") e descarta o que sobra redundante. */
export function resumoDoGuia(titulo: string, descricao: string): string {
    const limpo = descricao.replace(CAUDA_PADRAO, '').replace(/[.\s]+$/, '')
    const palavras = (s: string) => s.split(/\s+/).filter(Boolean).length
    return palavras(limpo) <= palavras(titulo) + 5 ? '' : limpo
}
