import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants/site'
import { DEFAULT_LOCALE, LOCALE_META, ACTIVE_LOCALES, type Locale } from '@/lib/i18n/config'
import { buildAlternates } from '@/lib/i18n/alternates'
import { href, type RouteName } from '@/lib/i18n/routes'

/** Páginas de texto institucionais: mesmo miolo em todo idioma, texto vindo de `institucional.*`. */
export type PaginaInstitucional = 'about' | 'contact' | 'ethics' | 'editorialStandards' | 'corrections'

const NAMESPACE = {
    about: 'institucional.about', contact: 'institucional.contact', ethics: 'institucional.ethics',
    editorialStandards: 'institucional.standards', corrections: 'institucional.corrections',
} as const satisfies Record<PaginaInstitucional, string>

/** Título, descrição e `alternates` (hreflang recíproco: a página existe traduzida em todo idioma ativo). */
export async function metadataInstitucional(rota: PaginaInstitucional, locale: Locale): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: NAMESPACE[rota] })
    const descricao = t.has('metaDescription') ? t('metaDescription') : undefined
    return {
        title: t('metaTitle'),
        ...(descricao && { description: descricao }),
        alternates: buildAlternates(rota as RouteName, undefined, locale, ACTIVE_LOCALES),
        ...(locale !== DEFAULT_LOCALE && { openGraph: { url: `${SITE_URL}${href(rota, undefined, locale)}`, locale: LOCALE_META[locale].ogLocale } }),
    }
}

export function PaginaDeTexto({ titulo, children, largura = 'max-w-2xl' }: { titulo: string; children: ReactNode; largura?: string }) {
    return (
        <div className={`page-wrap py-12 ${largura}`}>
            <h1 className="text-[36px] font-black mb-6 text-foreground">{titulo}</h1>
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-[15px] text-foreground leading-relaxed">
                {children}
            </div>
        </div>
    )
}

export const Titulo2 = ({ children }: { children: ReactNode }) => (
    <h2 className="text-[20px] font-black mt-8 mb-3">{children}</h2>
)

export const Lista = ({ itens }: { itens: string[] }) => (
    <ul className="list-disc list-inside space-y-2 text-muted">
        {itens.map((item) => <li key={item}>{item}</li>)}
    </ul>
)

/** Funções de `t.rich` para os links internos dentro dos parágrafos. */
export function linksDe(locale: Locale) {
    const link = (rota: PaginaInstitucional) => {
        const Link = (chunks: ReactNode) => (
            <a href={href(rota, undefined, locale)} className="text-accent hover:underline">{chunks}</a>
        )
        return Link
    }
    return {
        padroes: link('editorialStandards'), etica: link('ethics'), correcoes: link('corrections'),
        contato: link('contact'), b: (chunks: ReactNode) => <strong>{chunks}</strong>,
    }
}
