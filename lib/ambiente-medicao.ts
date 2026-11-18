import { useSyncExternalStore } from 'react'
import { ambienteDoHost } from '@/lib/sentryAmbiente'
import { simulacaoAtiva } from '@/lib/simulacao-anuncios'

/**
 * Medição de visitantes (Umami, Clarity) só em produção.
 *
 * O bundle é o mesmo em staging e produção (ver sentryAmbiente.ts), então não
 * há variável de build que separe os dois: o ambiente sai do host, no navegador.
 * Sem isto, teste feito no staging entrava no painel como tráfego real — e, no
 * caso do Clarity, gravava a sessão de quem validava o deploy.
 *
 * O Umami já ignorava hosts fora de `data-domains`, mas ainda baixava o script;
 * o Clarity não tinha restrição nenhuma.
 */
export function medicaoPermitida(host: string): boolean {
    return ambienteDoHost(host) === 'production'
}

/**
 * Modo dono: o aparelho de quem testa o site não entra na medição.
 *
 * Abrir qualquer página com `?hh-teste=1` marca o aparelho (fica no
 * localStorage, vale para todas as páginas e visitas seguintes até
 * `?hh-teste=0`). Marcado, nem o Umami nem o Clarity são montados. Também grava
 * `umami.disabled`, a chave que o próprio script do Umami consulta antes de cada
 * envio: cobre a aba em que o script já estava carregado antes da marca.
 *
 * Por que não filtrar por IP no servidor: o IP do dono muda (celular, Wi-Fi) e
 * chega pelo Cloudflare; a marca no aparelho vale em qualquer rede.
 */
export const CHAVE_SEM_MEDICAO = 'hh-sem-medicao'
const CHAVE_UMAMI = 'umami.disabled'

type Armazenamento = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function aparelhoSemMedicao(busca: string, armazenamento: Armazenamento | null): boolean {
    const pedido = new URLSearchParams(busca).get('hh-teste')
    try {
        if (pedido === '1') {
            armazenamento?.setItem(CHAVE_SEM_MEDICAO, '1')
            armazenamento?.setItem(CHAVE_UMAMI, '1')
        } else if (pedido === '0') {
            armazenamento?.removeItem(CHAVE_SEM_MEDICAO)
            armazenamento?.removeItem(CHAVE_UMAMI)
        }
        return armazenamento?.getItem(CHAVE_SEM_MEDICAO) === '1' || pedido === '1'
    } catch {
        // Storage bloqueado (aba anônima restrita): vale só o pedido desta URL.
        return pedido === '1'
    }
}

function armazenamentoLocal(): Armazenamento | null {
    try {
        return window.localStorage
    } catch {
        return null
    }
}

const semAssinatura = () => () => {}
const noNavegador = () =>
    medicaoPermitida(window.location.hostname) && !aparelhoSemMedicao(window.location.search, armazenamentoLocal()) && !simulacaoAtiva()
/** No servidor o host não é conhecido: nada é montado, a decisão fica para o cliente. */
const noServidor = () => false

export function useMedicaoPermitida(): boolean {
    return useSyncExternalStore(semAssinatura, noNavegador, noServidor)
}
