/**
 * Ambiente do Sentry.
 *
 * `NODE_ENV` não serve: é `production` em todo build, e a imagem que o staging
 * valida é a MESMA que produção promove (scripts/lib/artefato.sh). Com ele, erro
 * provocado em teste no staging chegava ao Sentry como produção.
 *
 * No navegador o bundle não sabe onde vai rodar, então o ambiente sai do host.
 * No servidor vem de `SENTRY_ENVIRONMENT`, definido pelo deploy de cada container.
 */
export type AmbienteSentry = 'production' | 'staging' | 'development'

export function ambienteDoHost(host: string): AmbienteSentry {
    const h = host.toLowerCase()
    if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local')) return 'development'
    if (h.startsWith('staging.')) return 'staging'
    return 'production'
}

export function ambienteDoServidor(env: Record<string, string | undefined> = process.env): string {
    return env.SENTRY_ENVIRONMENT || (env.NODE_ENV === 'production' ? 'production' : 'development')
}
