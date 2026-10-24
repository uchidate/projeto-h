import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'
import type { BestOfList } from '@/lib/wordpress/site-settings'

/* Guia de cultura (link curado, editável no WP admin). */
function CultureGuideChip({ guide }: { guide: BestOfList }) {
    return (
        <Link
            href={guide.href}
            className="group flex items-center gap-3 p-4 border border-border bg-background transition-colors hover:border-accent hover:bg-surface/60"
        >
            <span className="text-[22px] leading-none shrink-0" aria-hidden="true">{guide.emoji}</span>
            <span className="text-[13px] font-bold leading-snug text-foreground group-hover:text-accent transition-colors">{guide.label}</span>
        </Link>
    )
}

/**
 * "Comece por aqui": o conteúdo que não vence (Cultura Coreana 101), logo depois da
 * capa. Antes ficava no fim da página, depois de quatro rolagens de notícia datada;
 * quem chega pela primeira vez não tinha como achar a porta de entrada.
 */
export async function HomeComecePorAqui({ guides, locale = DEFAULT_LOCALE }: { guides: BestOfList[]; locale?: Locale }) {
    if (guides.length === 0) return null
    const t = await getTranslations({ locale, namespace: 'home.abaixoDaDobra' })
    const tc = await getTranslations({ locale, namespace: 'home.comum' })
    return (
        <section className="border-t border-border px-4 py-5 sm:px-6 lg:px-5">
            <SectionTitleBar title={t('guiasTitulo')} tag={t('guiasTag')} href="/cultura-coreana-101" linkText={tc('verTodos')} className="mb-3" />
            <div className="-mx-4 grid auto-cols-[minmax(240px,78vw)] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid-flow-row sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
                {guides.slice(0, 6).map(g => <CultureGuideChip key={g.href} guide={g} />)}
            </div>
        </section>
    )
}
