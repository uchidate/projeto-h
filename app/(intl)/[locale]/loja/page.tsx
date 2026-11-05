import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import { LojaListagem, metadataLoja } from '@/components/loja/LojaListagem'

// Só em português por decisão do manifesto (lib/i18n/route-manifest.ts): em outro idioma, 404.
// Estática de propósito: ler `searchParams` aqui tornaria a rota dinâmica (`cache-control: no-store`).
// Com filtro ou busca, um rewrite de lib/i18n/rotas-migradas.mjs manda a mesma URL para ./filtrado.
export const revalidate = 300

const SEM_FILTRO = Promise.resolve({})

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return idiomaValido(locale, { servePt: true }) && locale === DEFAULT_LOCALE ? metadataLoja : {}
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale !== DEFAULT_LOCALE) notFound()
    return <LojaListagem searchParams={SEM_FILTRO} />
}
