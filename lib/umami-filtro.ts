import { tipoDePagina } from '@/lib/tipoDePagina'
import { classeDaVisita } from '@/lib/visita'

/**
 * Rotas onde o Umami não carrega nem conta nada. Prefixo, não igualdade: cobre
 * subrotas (`/cadastro/etapa-2`). Ver o porquê no cabeçalho de UmamiScript.
 */
const ROTAS_SEM_MEDICAO = ['/entrar', '/cadastro']

export function rotaSemMedicao(caminho: string): boolean {
    return ROTAS_SEM_MEDICAO.some((r) => caminho === r || caminho.startsWith(`${r}/`))
}

/**
 * Gancho `data-before-send` do Umami: roda a cada envio (pageview, evento,
 * desempenho) com `(tipo, payload)`; devolver vazio DESCARTA o envio.
 *
 * É o que permite manter o rastreamento automático ligado — e com ele a coleta
 * de Web Vitals, que só é iniciada junto do rastreamento automático — sem contar
 * as rotas excluídas quando a navegação é SPA. Sem `url`, ou com `url` que não
 * se lê, deixa passar: melhor contar a mais do que perder medição em silêncio.
 */
export function umamiAntesDeEnviar<T extends { url?: string; data?: Record<string, unknown> }>(tipo: string, payload: T): T | null {
    if (!payload?.url) return payload
    try {
        const caminho = new URL(payload.url, 'https://origem.invalida').pathname
        if (rotaSemMedicao(caminho)) return null
        // Contexto em TODO evento e pageview, num lugar só: cada `track*` deixaria
        // de repetir isto (e esqueceria). `tipo_pagina` agrupa por espécie de página
        // em vez de URL; `visita` diz se a pessoa é nova ou voltou; `variante` (quando a página faz parte de um teste, via `data-variante` no HTML) permite comparar os braços em qualquer métrica. O que o evento
        // já traz por conta própria vence.
        if (tipo !== 'event') return payload
        const variante = typeof document !== 'undefined' ? document.querySelector('[data-variante]')?.getAttribute('data-variante') : null
        return { ...payload, data: { tipo_pagina: tipoDePagina(caminho), visita: classeDaVisita(), ...(variante && { variante }), ...payload.data } }
    } catch {
        return payload
    }
}
