import { createTranslator } from 'next-intl'
import { PT_MESSAGES } from './messages'

/**
 * Tradutor em português para testes que chamam funções (não componentes) que
 * recebem `t` — ex.: buildGroupProfileEntries. Fora de componente não há hook.
 */
export function ptTranslator<N extends keyof typeof PT_MESSAGES>(namespace: N) {
    return createTranslator({ locale: 'pt', messages: PT_MESSAGES, namespace })
}
