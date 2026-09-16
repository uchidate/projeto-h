/**
 * Estados de conteúdo salvos ANTES de existir conta.
 *
 * Por que isto existe: até 2026-09-12, favoritar exigia login. O botão de quem
 * não tinha conta não favoritava nada — era um link para /entrar. Ou seja, o
 * site pedia cadastro no único momento em que o visitante ainda não devia nada
 * a ele, e o clique que demonstrava interesse virava um formulário.
 *
 * Aqui a ordem se inverte: favorita primeiro, no navegador; a conta é oferecida
 * depois, para NÃO PERDER o que já foi guardado. O pedido passa a proteger um
 * investimento que já existe, em vez de cobrar antecipado.
 *
 * Escopo deliberadamente pequeno: isto é uma antessala, não um banco. Guarda o
 * mínimo para reproduzir os cliques na conta assim que ela aparecer, e some
 * depois da fusão.
 */
import type { ContentObjectType, ContentState } from '@/lib/wordpress/userApi'

const CHAVE = 'hh-estado-pendente-v1'
const LIMITE = 100

export type EstadoPendente = {
    objectType: ContentObjectType
    objectId: number
    state: Exclude<ContentState, ''>
}

function chaveDe(e: Pick<EstadoPendente, 'objectType' | 'objectId' | 'state'>) {
    return `${e.objectType}:${e.objectId}:${e.state}`
}

/**
 * Toda leitura e escrita é protegida: localStorage lança em aba anônima com
 * cookies bloqueados, e em cota estourada. Falhar aqui não pode derrubar o
 * botão — o pior aceitável é o estado não sobreviver ao recarregamento.
 */
export function lerPendentes(): EstadoPendente[] {
    try {
        const bruto = window.localStorage.getItem(CHAVE)
        if (!bruto) return []
        const dados: unknown = JSON.parse(bruto)
        if (!Array.isArray(dados)) return []
        return dados.filter((d): d is EstadoPendente =>
            !!d && typeof d === 'object'
            && typeof (d as EstadoPendente).objectId === 'number'
            && typeof (d as EstadoPendente).objectType === 'string'
            // O predicado roda sobre JSON, cujo tipo o TS não conhece: a
            // comparação com '' aqui seria "sem sobreposição" para ele, e é
            // justamente a que barra lixo vindo do storage.
            && typeof (d as EstadoPendente).state === 'string'
            && ((d as EstadoPendente).state as string).length > 0,
        )
    } catch {
        return []
    }
}

function gravar(lista: EstadoPendente[]) {
    try {
        window.localStorage.setItem(CHAVE, JSON.stringify(lista.slice(-LIMITE)))
    } catch {
        /* cota ou storage bloqueado: o estado vive só nesta página */
    }
}

export function estaPendente(objectType: ContentObjectType, objectId: number, state: Exclude<ContentState, ''>): boolean {
    return lerPendentes().some(e => chaveDe(e) === chaveDe({ objectType, objectId, state }))
}

/** Liga/desliga e devolve o estado resultante, para o botão não reler o storage. */
export function alternarPendente(objectType: ContentObjectType, objectId: number, state: Exclude<ContentState, ''>): boolean {
    const atual = lerPendentes()
    const alvo = chaveDe({ objectType, objectId, state })
    const jaTinha = atual.some(e => chaveDe(e) === alvo)
    gravar(jaTinha ? atual.filter(e => chaveDe(e) !== alvo) : [...atual, { objectType, objectId, state }])
    return !jaTinha
}

export function limparPendentes() {
    try {
        window.localStorage.removeItem(CHAVE)
    } catch {
        /* nada a fazer: sem storage não havia o que limpar */
    }
}
