import type { Locale } from './config'
import ptEntity from '@/messages/pt/entity.json'
import ptProfile from '@/messages/pt/profile.json'
import ptClient from '@/messages/pt/client.json'
import { SITE_NAME } from '@/lib/constants/identidade.mjs'

/**
 * O nome do site nao e versionado nas mensagens: elas trazem o marcador
 * `__SITE__`, trocado aqui pelo nome configurado (ver identidade.mjs).
 */
function comNomeDoSite<T>(valor: T): T {
    if (typeof valor === 'string') return valor.replaceAll('__SITE__', SITE_NAME) as T
    if (Array.isArray(valor)) return valor.map(comNomeDoSite) as T
    if (valor && typeof valor === 'object') {
        return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, comNomeDoSite(v)])) as T
    }
    return valor
}

/**
 * Catálogo de mensagens por idioma — ver D4 em docs/I18N-ARQUITETURA.md.
 *
 * O português é a fonte da verdade: `Messages` é derivado dele, e cada outro
 * idioma é anotado com esse tipo. Chave faltando ou sobrando em `en` quebra o
 * `type-check`, não a página em produção.
 *
 * Um namespace = um arquivo em messages/<locale>/. Ao criar um namespace,
 * registre-o nos dois objetos abaixo.
 */
const pt = comNomeDoSite({ entity: ptEntity, profile: ptProfile, client: ptClient })

export type Messages = typeof pt

/** Mensagens em português, síncronas — para testes e o mock de next-intl. */
export const PT_MESSAGES: Messages = pt

const loaders: Record<Locale, () => Promise<Messages>> = {
    pt: async () => pt,
    en: async () => {
        const [entity, profile, client]: [Messages['entity'], Messages['profile'], Messages['client']] = await Promise.all([
            import('@/messages/en/entity.json').then((m) => m.default),
            import('@/messages/en/profile.json').then((m) => m.default),
            import('@/messages/en/client.json').then((m) => m.default),
        ])
        return comNomeDoSite({ entity, profile, client })
    },
}

export function loadMessages(locale: Locale): Promise<Messages> {
    return loaders[locale]()
}
