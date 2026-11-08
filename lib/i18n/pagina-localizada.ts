import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, type Locale } from './config'
import { entrarNaPagina, idiomaValido } from './pagina'

/**
 * Contexto que a página recebe já validado: o idioma é um `Locale` ativo (idioma desligado ou inexistente
 * nunca chega aqui), `params` traz o resto da rota sem `locale` e `searchParams` (a Promise da query, tipo `S`) só existe quando a página
 * declara `comSearchParams` (ler a query torna a rota dinâmica, então não é repassada por padrão).
 */
export type ContextoDaPagina<P extends object, S> = { locale: Locale; params: P; searchParams: S }

type Definicao<P extends object, S> = {
    /** Metadados da página no idioma. Sem isto, `{}`. */
    metadata?: (ctx: ContextoDaPagina<P, S>) => Metadata | Promise<Metadata>
    render: (ctx: ContextoDaPagina<P, S>) => ReactNode | Promise<ReactNode>
    /** Repassa `searchParams` a `metadata` e `render`. Só para rota que já é dinâmica por escolha. */
    comSearchParams?: boolean
    /** Página que só existe em português por decisão do manifesto de rotas: metadados `{}` e 404 nos outros idiomas. */
    soPortugues?: boolean
}

type Entrada<P extends object, S> = { params: Promise<P & { locale: string }>; searchParams?: S }

/**
 * Fábrica do par que toda página de `app/[locale]` repetia à mão: `generateMetadata` (idioma inválido →
 * `{}`) e o componente da página (idioma inválido → 404 e fixa o idioma da renderização).
 *
 * ```ts
 * export const revalidate = 600 // literal: o Next lê isto estaticamente, por isso fica na página
 * const pagina = paginaLocalizada({ metadata: ({ locale }) => metadataX(locale), render: ({ locale }) => <X locale={locale} /> })
 * export const generateMetadata = pagina.generateMetadata
 * export default pagina.Page
 * ```
 *
 * Todas as páginas aceitam o português (`servePt`): a árvore única serve `pt` sem prefixo por rewrite.
 */
export function paginaLocalizada<P extends object = object, S = undefined>(def: Definicao<P, S>) {
    const contexto = async ({ params, searchParams }: Entrada<P, S>) => {
        const { locale, ...resto } = await params
        return { locale, params: resto as unknown as P, searchParams: (def.comSearchParams ? searchParams : undefined) as S }
    }
    return {
        async generateMetadata(entrada: Entrada<P, S>): Promise<Metadata> {
            const ctx = await contexto(entrada)
            if (!idiomaValido(ctx.locale, { servePt: true })) return {}
            if (def.soPortugues && ctx.locale !== DEFAULT_LOCALE) return {}
            return def.metadata ? def.metadata({ ...ctx, locale: ctx.locale }) : {}
        },
        async Page(entrada: Entrada<P, S>) {
            const ctx = await contexto(entrada)
            entrarNaPagina(ctx.locale, { servePt: true })
            if (def.soPortugues && ctx.locale !== DEFAULT_LOCALE) notFound()
            return def.render({ ...ctx, locale: ctx.locale })
        },
    }
}
