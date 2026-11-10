import type { Locale } from './config'
import ptEntity from '@/messages/pt/entity.json'
import ptProfile from '@/messages/pt/profile.json'
import ptClient from '@/messages/pt/client.json'
import ptInstitucional from '@/messages/pt/institucional.json'
import ptHome from '@/messages/pt/home.json'
import ptQuiz from '@/messages/pt/quiz.json'
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
const pt = comNomeDoSite({ entity: ptEntity, profile: ptProfile, client: ptClient, institucional: ptInstitucional, home: ptHome, quiz: ptQuiz })

export type Messages = typeof pt

/** Mensagens em português, síncronas — para testes e o mock de next-intl. */
export const PT_MESSAGES: Messages = pt

/**
 * Idioma sem catálogo próprio usa o de outro até ser traduzido (namespace por namespace, em `loaders`).
 * Hoje todos os idiomas têm catálogo completo; o mapa fica para o próximo idioma novo.
 */
const FALLBACK: Partial<Record<Locale, Locale>> = {}

/** Namespaces de messages/<idioma>/<ns>.json. Ao criar um, registre-o também no `pt` acima e em `IMPORTADORES`. */
const NAMESPACES = ['entity', 'profile', 'client', 'institucional', 'home', 'quiz'] as const
type Namespace = (typeof NAMESPACES)[number]

/**
 * Imports com caminho literal: o bundler só inclui o JSON que enxerga. Um caminho montado em tempo de
 * execução (`@/messages/${locale}/${ns}.json`) passou no vitest e quebrou o build ("Cannot find module").
 * `Record<Exclude<Locale, 'pt'>, ...>` faz um idioma novo sem linha aqui falhar no `tsc`.
 */
const IMPORTADORES: Record<Exclude<Locale, 'pt'>, Record<Namespace, () => Promise<{ default: unknown }>>> = {
    en: {
        entity: () => import('@/messages/en/entity.json'), profile: () => import('@/messages/en/profile.json'),
        client: () => import('@/messages/en/client.json'), institucional: () => import('@/messages/en/institucional.json'),
        home: () => import('@/messages/en/home.json'), quiz: () => import('@/messages/en/quiz.json'),
    },
    es: {
        entity: () => import('@/messages/es/entity.json'), profile: () => import('@/messages/es/profile.json'),
        client: () => import('@/messages/es/client.json'), institucional: () => import('@/messages/es/institucional.json'),
        home: () => import('@/messages/es/home.json'), quiz: () => import('@/messages/es/quiz.json'),
    },
    ja: {
        entity: () => import('@/messages/ja/entity.json'),
        profile: () => import('@/messages/ja/profile.json'),
        client: () => import('@/messages/ja/client.json'), institucional: () => import('@/messages/ja/institucional.json'),
        home: () => import('@/messages/ja/home.json'), quiz: () => import('@/messages/ja/quiz.json'),
    },
}

async function carregarIdioma(locale: Exclude<Locale, 'pt'>): Promise<Messages> {
    const pares = await Promise.all(NAMESPACES.map(async (ns) => [ns, (await IMPORTADORES[locale][ns]()).default] as const))
    return comNomeDoSite(Object.fromEntries(pares) as Messages)
}

const loaders: Partial<Record<Locale, () => Promise<Messages>>> = {
    pt: async () => pt,
}

export function loadMessages(locale: Locale): Promise<Messages> {
    const carregar = loaders[locale]
    if (carregar) return carregar()
    const alternativo = FALLBACK[locale]
    return alternativo ? loadMessages(alternativo) : carregarIdioma(locale as Exclude<Locale, 'pt'>)
}
