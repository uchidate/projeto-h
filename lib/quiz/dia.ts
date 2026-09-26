/** Pergunta do dia: mesma para todos no mesmo dia (horário de Brasília) e sequência de dias seguidos. */
export interface EstadoDia { ultimo: string; resposta: number; acertou: boolean; sequencia: number }

export function chaveDia(data: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(data)
}

function diaAnterior(chave: string): string {
    const [a, m, d] = chave.split('-').map(Number)
    return chaveDia(new Date(Date.UTC(a, m - 1, d, 12) - 86_400_000))
}

/** Escolha estável: ordena por id e usa o número do dia como índice, então não repete até dar a volta no banco inteiro. */
export function escolherDoDia<T extends { id: number }>(perguntas: T[], chave: string): T | null {
    if (perguntas.length === 0) return null
    const ordenadas = [...perguntas].sort((a, b) => a.id - b.id)
    const [a, m, d] = chave.split('-').map(Number)
    const dias = Math.floor(Date.UTC(a, m - 1, d) / 86_400_000)
    return ordenadas[dias % ordenadas.length]
}

/** Sequência depois de responder hoje: continua se respondeu ontem, recomeça se pulou um dia. */
export function sequenciaApos(anterior: EstadoDia | null, hoje: string): number {
    if (!anterior) return 1
    if (anterior.ultimo === hoje) return anterior.sequencia
    return anterior.ultimo === diaAnterior(hoje) ? anterior.sequencia + 1 : 1
}

/** Sequência a mostrar antes de responder: some se já passou de ontem sem resposta. */
export function sequenciaVigente(estado: EstadoDia | null, hoje: string): number {
    if (!estado) return 0
    return estado.ultimo === hoje || estado.ultimo === diaAnterior(hoje) ? estado.sequencia : 0
}

export function interpretarEstado(cru: string): EstadoDia | null {
    try {
        const e = cru ? JSON.parse(cru) : null
        return e && typeof e.ultimo === 'string' && typeof e.sequencia === 'number' && typeof e.resposta === 'number' ? e : null
    } catch { return null }
}
