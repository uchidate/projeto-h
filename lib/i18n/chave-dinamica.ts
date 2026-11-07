/**
 * Tradução por chave montada em tempo de execução (`labels.${posicao}`, `items.${id}.label`).
 * O tipo de `t` do next-intl só aceita chaves literais conhecidas; a chave dinâmica é checada
 * por teste (ver messages e lib/i18n/client-namespaces.test.ts), não pelo compilador. Isso
 * concentra o único cast num lugar, em vez de `as 'labels.leader'` espalhado.
 */
type Tradutor = (chave: string, valores?: Record<string, unknown>) => string

export function traduzirChave(t: unknown, chave: string, valores?: Record<string, unknown>): string {
    return (t as Tradutor)(chave, valores)
}
