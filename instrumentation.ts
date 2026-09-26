import * as Sentry from '@sentry/nextjs'

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config')
        // Aquece o indice da busca sem segurar a subida do servidor: a primeira
        // busca depois de cada deploy nao precisa cair no caminho REST lento.
        void import('./lib/search/index').then(m => m.aguardarIndice()).catch(() => {})
    }
    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.edge.config')
    }
}

export const onRequestError = Sentry.captureRequestError
