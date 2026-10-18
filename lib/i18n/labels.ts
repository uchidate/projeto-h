import { createTranslator } from 'next-intl'
import { DEFAULT_LOCALE, type Locale } from './config'
import pt from '@/messages/pt/labels.json'
import en from '@/messages/en/labels.json'

/**
 * Rótulos de dados (papéis, tipo de grupo, geração, tipo e status de produção)
 * usados fora de componentes — nos modelos de `lib/profiles`, que são funções
 * puras e não têm hook. Catálogo pequeno e síncrono; não entra no `Messages`
 * do next-intl porque não depende da requisição.
 */
const CATALOG: Record<Locale, typeof pt> = { pt, en }

export function labelsFor(locale: Locale = DEFAULT_LOCALE) {
    const t = createTranslator({ locale, messages: { labels: CATALOG[locale] }, namespace: 'labels' })
    const pick = (group: keyof typeof pt, key: string | undefined): string | undefined => {
        if (!key) return undefined
        const table = CATALOG[locale][group] as Record<string, string> | undefined
        return table && key in table ? t(`${group}.${key}` as never) : undefined
    }
    return {
        t,
        /**
         * Papel do artista. Com o sexo cadastrado ('male' | 'female') sai a forma certa: Cantor/Cantora,
         * Ator/Atriz, Dançarino/Dançarina...; sem ele (ou com qualquer outro valor) cai na forma neutra
         * ("Cantor(a)", "Ator/Atriz"). Valor que não é sexo é ignorado de propósito: `.map(labels.role)`
         * passa o índice como 2º argumento.
         */
        role: (role: string, gender?: unknown) => {
            const porSexo = gender === 'female' ? pick('roleF', role) : gender === 'male' ? pick('roleM', role) : undefined
            return porSexo ?? pick('role', role) ?? role
        },
        groupType: (type: string) => pick('groupType', type) ?? type,
        productionType: (type: string) => pick('productionType', type) ?? type,
        productionStatus: (status: string) => pick('productionStatus', status),
        generation: (n: number) => t('generation', { n }),
    }
}

export type Labels = ReturnType<typeof labelsFor>
