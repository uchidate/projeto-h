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

/** Namespaces de messages/<idioma>/<ns>.json. Ao criar um, registre-o também no `pt` acima. */
const NAMESPACES = ['entity', 'profile', 'client', 'institucional', 'home', 'quiz'] as const

/**
 * Idioma novo = pasta `messages/<idioma>/` com os mesmos arquivos do português; nada a registrar aqui.
 * O caminho é montado em tempo de execução, então a paridade de chaves (e de variáveis) com o português é
 * garantida pelos testes de `lib/i18n/*paridade*` e não mais pelo `tsc`.
 */
async function carregarIdioma(locale: Locale): Promise<Messages> {
    const pares = await Promise.all(NAMESPACES.map(async (ns) => [ns, (await import(`@/messages/${locale}/${ns}.json`)).default] as const))
    return comNomeDoSite(Object.fromEntries(pares) as Messages)
}

const loaders: Partial<Record<Locale, () => Promise<Messages>>> = {
    pt: async () => pt,
}

export function loadMessages(locale: Locale): Promise<Messages> {
    const carregar = loaders[locale]
    if (carregar) return carregar()
    const alternativo = FALLBACK[locale]
    return alternativo ? loadMessages(alternativo) : carregarIdioma(locale)
}
