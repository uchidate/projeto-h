import { capturarErro, carregarSentry, sentryCarregado } from '@/lib/sentryCliente'
import { instalarToleranciaTradutor } from '@/lib/toleranciaTradutor'

// Antes de o React montar: tradutor de página não pode derrubar a ficha de quem
// lê o site em outro idioma (ver lib/toleranciaTradutor.ts).
if (typeof window !== 'undefined') instalarToleranciaTradutor()

// O SDK do Sentry sai do caminho da primeira pintura: carrega quando o
// navegador fica ocioso. Motivo e medição em lib/sentryCliente.ts.
//
// Entre o início da página e esse carregamento, erro global não pode sumir.
// Os ouvintes abaixo guardam o que acontecer, pedem o SDK na hora e são
// removidos assim que ele chega — dali em diante os handlers globais do próprio
// Sentry assumem, e manter os nossos duplicaria cada evento.
if (typeof window !== 'undefined') {
    const aoErro = (evento: ErrorEvent) => capturarErro(evento.error ?? evento.message)
    const aoRejeicao = (evento: PromiseRejectionEvent) => capturarErro(evento.reason)

    window.addEventListener('error', aoErro)
    window.addEventListener('unhandledrejection', aoRejeicao)

    const carregar = () => {
        carregarSentry()
            .catch(() => { /* sem SDK, os ouvintes seguem sem ter a quem entregar */ })
            .finally(() => {
                window.removeEventListener('error', aoErro)
                window.removeEventListener('unhandledrejection', aoRejeicao)
            })
    }

    // Safari não tem requestIdleCallback. O prazo de 4s garante o carregamento
    // mesmo em página que nunca fica ociosa (anúncio, animação contínua).
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(carregar, { timeout: 4000 })
    } else {
        setTimeout(carregar, 2000)
    }
}

// Transição de rota antes do carregamento é descartada de propósito: o cliente
// roda com tracesSampleRate 0, então não haveria span a registrar de qualquer forma.
export function onRouterTransitionStart(
    ...args: Parameters<typeof import('@/lib/sentryNucleo').captureRouterTransitionStart>
) {
    sentryCarregado()?.captureRouterTransitionStart(...args)
}
