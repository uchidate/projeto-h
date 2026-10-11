import { useSyncExternalStore } from 'react'
import { ambienteDoHost } from '@/lib/sentryAmbiente'

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

const semAssinatura = () => () => {}
const noNavegador = () => medicaoPermitida(window.location.hostname)
/** No servidor o host não é conhecido: nada é montado, a decisão fica para o cliente. */
const noServidor = () => false

export function useMedicaoPermitida(): boolean {
    return useSyncExternalStore(semAssinatura, noNavegador, noServidor)
}
