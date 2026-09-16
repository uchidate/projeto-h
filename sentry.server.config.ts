import * as Sentry from '@sentry/nextjs'
import { ambienteDoServidor } from '@/lib/sentryAmbiente'

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // SENTRY_ENVIRONMENT vem do deploy; NODE_ENV é 'production' também no staging.
    environment: ambienteDoServidor(),
    initialScope: { tags: { runtime: 'nextjs-servidor' } },
    // Liga o erro ao deploy que o introduziu. Sem isto, "quando isso comecou?"
    // vira arqueologia de log. O SHA e injetado pelo deploy-production.sh, o
    // mesmo que alimenta <prefixo>_build_info em /api/metrics — um identificador
    // so, entre metrica, erro e commit.
    release: process.env.GIT_COMMIT_SHA,
    tracesSampleRate: 0.1,
    enabled: !!process.env.SENTRY_DSN,
})
