import type { Metadata } from 'next'
import GroupSlugPage, { generateMetadata as metadataEmPortugues, slugsPreGerados } from '@/components/groups/GroupSlugPage'
import { GroupRoute, buildGroupMetadata } from '@/components/groups/GroupRoute'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

// 6h (era 600s). O `s-maxage` da borda vem daqui, e com 600s a cauda longa quase nunca
// acertava o cache (3 de 40 páginas, 2026-09-24; miss custa 0,8 a 2,2s contra 0,2s).
// Seguro porque `/api/revalidate` expurga a cópia da borda deste item (lib/cloudflare-purge.ts).
// Mudança feita por script SEM passar por essa rota só aparece na borda em até 6h:
// use o skill revalidar-cache depois de alteração programática.
export const revalidate = 21600

type Params = Promise<{ locale: string; slug: string }>

// Pré-geração só do português. O filho devolve SEMPRE `{ locale, slug }` completos: se devolvesse
// vazio para `en`, o Next repassaria `{ locale: 'en' }` sem `slug` e, por haver um conjunto
// incompleto, desistiria de pré-gerar TODOS os slugs. Os outros idiomas renderizam sob demanda com ISR.
export async function generateStaticParams() {
    return (await slugsPreGerados()).map(item => ({ locale: DEFAULT_LOCALE, ...item }))
}

/** Português: página por tipo (/groups/girl-groups) ou ficha. Outros idiomas: a ficha traduzida. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    if (locale === DEFAULT_LOCALE) return metadataEmPortugues({ params: Promise.resolve({ slug }) })
    return buildGroupMetadata(slug, locale)
}

export default async function Page({ params }: { params: Params }) {
    const { locale, slug } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale === DEFAULT_LOCALE) return <GroupSlugPage params={Promise.resolve({ slug })} />
    return <GroupRoute slug={slug} locale={locale} />
}
