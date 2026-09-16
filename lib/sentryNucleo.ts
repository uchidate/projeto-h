/**
 * O que o cliente usa do Sentry, e só isso.
 *
 * Existe para ser o alvo do `import()` em lib/sentryCliente.ts. Um
 * `import('@sentry/nextjs')` direto traz o namespace inteiro, porque o bundler
 * não consegue podar import dinâmico de namespace: o chunk tardio saiu com
 * 157KB gzip, com Replay e Feedback dentro — três vezes o SDK de antes. Import
 * NOMEADO e estático aqui deixa a poda funcionar dentro do chunk tardio.
 */
export { captureException, captureRouterTransitionStart, init } from '@sentry/nextjs'
