/**
 * Visitante novo ou de volta, sem identificar ninguém.
 *
 * O Umami daqui não guarda `distinct_id`, então "quantos voltam" não tem resposta
 * — e sem ela não dá para saber se o site vira hábito, que é o que a retenção
 * realmente mede. Guardar só o DIA da primeira visita, no navegador, responde
 * isso sem id, sem cookie e sem cruzar sessões: o que sai para o Umami é uma
 * palavra ("novo" ou "voltou"), não um identificador.
 *
 * Definição: "voltou" = abriu o site em um dia diferente do primeiro. Quem abre
 * várias vezes no mesmo dia continua "novo" — voltar no mesmo dia é continuidade
 * de uma leitura, não retorno.
 */
export type ClasseDeVisita = 'novo' | 'voltou'

const CHAVE = 'hh-primeira-visita-v1'

const dia = (agora: number) => new Date(agora).toISOString().slice(0, 10)

export function classeDaVisita(agora: number = Date.now()): ClasseDeVisita {
    if (typeof window === 'undefined') return 'novo'
    try {
        const hoje = dia(agora)
        const guardado = window.localStorage.getItem(CHAVE)
        // Valida em vez de confiar: o valor é do navegador e pode ter sido alterado.
        if (guardado && /^\d{4}-\d{2}-\d{2}$/.test(guardado)) return guardado < hoje ? 'voltou' : 'novo'
        window.localStorage.setItem(CHAVE, hoje)
        return 'novo'
    } catch {
        // Modo privado ou cota estourada: sem memória, todo mundo é "novo".
        return 'novo'
    }
}
