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
export function umamiAntesDeEnviar<T extends { url?: string }>(_tipo: string, payload: T): T | null {
    if (!payload?.url) return payload
    try {
        const caminho = new URL(payload.url, 'https://origem.invalida').pathname
        return rotaSemMedicao(caminho) ? null : payload
    } catch {
        return payload
    }
}
