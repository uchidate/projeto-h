/**
 * Fonte única dos idiomas, em JavaScript puro para que o `next.config.mjs` (que não lê TypeScript) e
 * `lib/i18n/config.ts` usem a mesma lista. Para adicionar um idioma, ver docs/I18N-NOVO-IDIOMA.md.
 */

/** Todo idioma que o código conhece. */
/** @type {readonly ["pt", "en", "es"]} */
export const LOCALES = Object.freeze(['pt', 'en', 'es'])

/** Idioma sem prefixo na URL. */
export const DEFAULT_LOCALE = 'pt'

/**
 * Idioma em que o conteúdo é escrito e de onde se traduz (WordPress, quiz, guias). Papel diferente de
 * `DEFAULT_LOCALE` (só a URL): hoje os dois são `pt`, e é isso que permite mexer na URL do português
 * (ex.: `/pt-br`) sem tocar na lógica de conteúdo, e vice-versa.
 */
export const SOURCE_LOCALE = 'pt'

/**
 * O que o público vê. Idioma que está em `LOCALES` mas não aqui existe no código e responde 404:
 * dá para construir e revisar o idioma em produção antes de ligá-lo.
 * @type {readonly ("pt" | "en" | "es")[]}
 */
export const ACTIVE_LOCALES = Object.freeze(['pt', 'en', 'es'])
